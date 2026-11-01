import { normaliseBarcode } from '../../lib/barcode.ts';
import { BadRequestError, ConflictError, HeldByUsersError, NotFoundError } from '../../lib/httpErrors.ts';
import { removeFunkoFolder, sizeUrl } from '../../lib/imageStorage.ts';
import { logger } from '../../lib/logger.ts';
import type { SubmitterScope } from '../../lib/catalogueVisibility.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import { isUsableCategory } from '../categories/categories.service.ts';
import { notifyAdminsOfNewSubmission, notifyFunkoRemoved } from '../notifications/notifications.service.ts';
import { isUsableSeries } from '../series/series.service.ts';
import {
  assertCanEditFunko,
  canSeeFunko,
  isAdminChangingSubmission,
  isInCatalogueOf,
  isOpenSubmission,
} from './funkos.access.ts';
import { getImages } from './images/funkoImages.service.ts';
import {
  funkosRepository,
  type CollectionSummaryRow,
  type ForcedDeleter,
  type ListedFunkoRow,
  type PrimaryImageRow,
} from './funkos.repository.ts';
import type {
  CreateFunko,
  DeleteFunko,
  DeleteFunkoQuery,
  FunkoDetailResponse,
  FunkoListResponse,
  FunkoResponse,
  ListFunkosQuery,
  UpdateFunko,
} from './funkos.schema.ts';
import type { FunkoIdentity, FunkoRow, FunkoStanding, FunkoSummary, PrimaryImageSummary } from './funkos.type.ts';

const ENTITY = 'Funko';
const REASON_NEEDED_MESSAGE = 'Removing a funko other users have needs a reason to tell them';

const log = logger.child({ module: 'funkos' });

type FunkoExtras = {
  primaryImage: PrimaryImageRow | undefined;
  collections: CollectionSummaryRow[];
};

const EMPTY_EXTRAS: FunkoExtras = { primaryImage: undefined, collections: [] };

function toPrimaryImage(row: PrimaryImageRow | undefined): PrimaryImageSummary | null {
  if (!row) return null;

  return {
    smallUrl: sizeUrl(row.funkoId, row.fileKey, 'small'),
    mediumUrl: sizeUrl(row.funkoId, row.fileKey, 'medium'),
    placeholder: row.placeholder,
    width: row.width,
    height: row.height,
  };
}

// A category or series a body points at that the funko may not use is the caller's input error: 400. A funko may
// use the approved ones, and a waiting submission also the ones its sender typed in (`submitterId`, null for a
// funko in the catalogue). Another member's waiting one answers like one that does not exist.
async function assertCategoryUsable(categoryId: number, submitterId: number | null): Promise<void> {
  const isUsable = await isUsableCategory(categoryId, submitterId);

  if (!isUsable) throw new BadRequestError(`Category ${categoryId} does not exist`);
}

async function assertSeriesUsable(seriesId: number, submitterId: number | null): Promise<void> {
  const isUsable = await isUsableSeries(seriesId, submitterId);

  if (!isUsable) throw new BadRequestError(`Series ${seriesId} does not exist`);
}

// Whose waiting categories and series a funko may use: its sender's while it waits (or is rejected, for them to fix
// and send again), nobody's once approved.
function referenceOwnerOf(funko: FunkoStanding): number | null {
  return isOpenSubmission(funko) ? funko.submittedById : null;
}

function toSummary(row: FunkoRow, primaryImage: PrimaryImageRow | undefined): FunkoSummary {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    type: row.type,
    isChase: row.isChase,
    exclusive: row.exclusive,
    barcode: row.barcode,
    category: { id: row.categoryId, name: row.categoryName },
    series: { id: row.seriesId, name: row.seriesName },
    primaryImage: toPrimaryImage(primaryImage),
  };
}

// `matchedOn` is only there for a list with a search (see ListedFunkoRow).
function toResponse(userId: number, row: FunkoRow | ListedFunkoRow, extras: FunkoExtras): FunkoResponse {
  const matchedOn = 'matchedOn' in row ? (row.matchedOn ?? undefined) : undefined;

  return {
    ...toSummary(row, extras.primaryImage),
    collections: extras.collections.map(({ id, name }) => ({ id, name })),
    status: row.status,
    isSubmittedByMe: row.submittedById === userId,
    matchedOn,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Two page-wide queries instead of two per row. `collections` lists only `userId`'s own: the funko is shared, the
// lists it sits in are not.
async function loadExtras(userId: number, rows: FunkoRow[]): Promise<Map<number, FunkoExtras>> {
  const ids = rows.map((row) => row.id);
  const [primaryImages, collectionsByFunko] = await Promise.all([
    funkosRepository.primaryImagesByFunkoIds(ids),
    funkosRepository.collectionsByFunkoIds(userId, ids),
  ]);

  return new Map(
    ids.map((id) => [
      id,
      {
        primaryImage: primaryImages.get(id),
        collections: collectionsByFunko.get(id) ?? [],
      },
    ]),
  );
}

async function toResponses(userId: number, rows: (FunkoRow | ListedFunkoRow)[]): Promise<FunkoResponse[]> {
  const extras = await loadExtras(userId, rows);

  return rows.map((row) => toResponse(userId, row, extras.get(row.id) ?? EMPTY_EXTRAS));
}

async function toSingleResponse(userId: number, row: FunkoRow): Promise<FunkoResponse> {
  const [response] = await toResponses(userId, [row]);

  if (!response) throw new NotFoundError(ENTITY, row.id);

  return response;
}

// Barcodes are kept in their 13-digit form (see lib/barcode) so a scan matches whatever was typed.
function withNormalisedBarcode<Data extends { barcode?: string | null }>(data: Data): Data {
  if (!data.barcode) return data;

  return { ...data, barcode: normaliseBarcode(data.barcode) };
}

const CATALOGUE_SCOPE: SubmitterScope = { submittedById: null };

// The duplicate guard within one scope: same (category, number, name, chase, exclusive) or same barcode answers 409
// with the existing id.
async function assertUniqueIn(
  scope: SubmitterScope,
  identity: FunkoIdentity,
  barcode: string | null | undefined,
  selfId?: number,
): Promise<void> {
  const sameIdentity = await funkosRepository.findIdByIdentity(identity, scope);
  const isOtherIdentity = sameIdentity !== undefined && sameIdentity.id !== selfId;

  if (isOtherIdentity) throw new ConflictError('This funko already exists', sameIdentity.id);

  if (!barcode) return;

  const sameBarcode = await funkosRepository.findIdByBarcode(normaliseBarcode(barcode), scope);
  const isOtherBarcode = sameBarcode !== undefined && sameBarcode.id !== selfId;

  if (isOtherBarcode) throw new ConflictError('This barcode belongs to another funko', sameBarcode.id);
}

// The unique rules hold in the approved catalogue and within one member's waiting submissions, never across
// members: two members may each wait on the same box. A waiting submission is also checked against the catalogue,
// so the member is pointed at the funko already there. Rejected and merged ones are not checked. Submissions asks it
// too, before a rejected one is sent again.
export async function assertUniqueFunko(
  funko: FunkoStanding,
  identity: FunkoIdentity,
  barcode: string | null | undefined,
  selfId?: number,
): Promise<void> {
  const isApproved = funko.status === 'APPROVED';
  const isWaiting = funko.status === 'WAITING';

  if (isApproved || isWaiting) await assertUniqueIn(CATALOGUE_SCOPE, identity, barcode, selfId);

  if (isWaiting) await assertUniqueIn({ submittedById: funko.submittedById }, identity, barcode, selfId);
}

export async function getFunkos(userId: number, query: ListFunkosQuery): Promise<FunkoListResponse> {
  const normalisedQuery = query.barcode ? { ...query, barcode: normaliseBarcode(query.barcode) } : query;
  const { data, totalResultNumber } = await funkosRepository.list(userId, normalisedQuery);
  const responses = await toResponses(userId, data);

  return { data: responses, totalResultNumber, currentPage: query.page };
}

// How a submission's review went, for those who may know: an admin, and its sender. An admin also reads who sent
// a submission in (not an approved funko: who added the catalogue is nobody's business).
async function reviewDetailsFor(user: SignedInUser, row: FunkoRow): Promise<Partial<FunkoDetailResponse>> {
  const isSender = row.submittedById !== null && row.submittedById === user.userId;
  const isSubmissionForAdmin = user.isAdmin && row.status !== 'APPROVED';

  if (!isSender && !user.isAdmin) return {};

  const review = await funkosRepository.findReview(row.id);

  if (!review) return {};

  return {
    rejectionReason: review.rejectionReason,
    changedByAdminAt: review.changedByAdminAt?.toISOString() ?? null,
    mergedInto: review.mergedInto,
    submittedBy: isSubmissionForAdmin ? review.submittedBy : undefined,
  };
}

// An admin reads how many users have the funko (never who), to know what deleting it takes.
async function holderDetailsFor(user: SignedInUser, id: number): Promise<Partial<FunkoDetailResponse>> {
  if (!user.isAdmin) return {};

  return { userCount: await funkosRepository.countHolders(id) };
}

export async function getFunko(user: SignedInUser, id: number): Promise<FunkoDetailResponse> {
  const row = await funkosRepository.findById(id);

  if (!row || !canSeeFunko(user, row)) throw new NotFoundError(ENTITY, id);

  const [response, images, reviewDetails, holderDetails] = await Promise.all([
    toSingleResponse(user.userId, row),
    getImages(id),
    reviewDetailsFor(user, row),
    holderDetailsFor(user, id),
  ]);

  return { ...response, images, ...reviewDetails, ...holderDetails };
}

export async function getFunkoByBarcode(userId: number, barcode: string): Promise<FunkoResponse> {
  const row = await funkosRepository.findByBarcode(userId, normaliseBarcode(barcode));

  if (!row) throw new NotFoundError(ENTITY, barcode);

  return toSingleResponse(userId, row);
}

// An admin's new funko joins the catalogue; a member's is a waiting submission only they see until it is approved.
export async function addFunko(user: SignedInUser, input: CreateFunko): Promise<FunkoResponse> {
  const data = withNormalisedBarcode(input);
  const standing: FunkoStanding = user.isAdmin
    ? { status: 'APPROVED', submittedById: null }
    : { status: 'WAITING', submittedById: user.userId };
  const identity: FunkoIdentity = {
    categoryId: data.categoryId,
    number: data.number,
    name: data.name,
    isChase: data.isChase ?? false,
    exclusive: data.exclusive ?? '',
  };

  await assertCategoryUsable(data.categoryId, referenceOwnerOf(standing));
  await assertSeriesUsable(data.seriesId, referenceOwnerOf(standing));
  await assertUniqueFunko(standing, identity, data.barcode);

  const row = await funkosRepository.create({ ...data, ...standing });

  log.info({ funkoId: row.id, status: row.status }, 'funko created');

  if (row.status === 'WAITING') await notifyAdminsOfNewSubmission({ funkoId: row.id, funkoName: row.name });

  return toSingleResponse(user.userId, row);
}

// An admin changes any funko; a member only their own waiting or rejected submission. An admin changing someone
// else's submission leaves a note its sender reads (`changedByAdminAt`).
export async function updateFunko(user: SignedInUser, id: number, input: UpdateFunko): Promise<FunkoResponse> {
  const data = withNormalisedBarcode(input);
  const current = assertCanEditFunko(user, id, await funkosRepository.findById(id));

  const identity: FunkoIdentity = {
    categoryId: data.categoryId ?? current.categoryId,
    number: data.number ?? current.number,
    name: data.name ?? current.name,
    isChase: data.isChase ?? current.isChase,
    exclusive: data.exclusive ?? current.exclusive,
  };

  if (data.categoryId !== undefined) await assertCategoryUsable(data.categoryId, referenceOwnerOf(current));
  if (data.seriesId !== undefined) await assertSeriesUsable(data.seriesId, referenceOwnerOf(current));
  await assertUniqueFunko(current, identity, data.barcode === undefined ? current.barcode : data.barcode, id);

  const adminChange = isAdminChangingSubmission(user, current) ? { changedByAdminAt: new Date() } : {};
  const row = await funkosRepository.update(id, { ...data, ...adminChange });

  if (!row) throw new NotFoundError(ENTITY, id);

  return toSingleResponse(user.userId, row);
}

// The user's own collections by name; anyone else's only as how many other users have it, never whose.
function describeCollections(ownCollectionNames: string[], otherHolderCount: number): string {
  const places = ownCollectionNames.map((name) => `"${name}"`);
  const otherUsers = otherHolderCount === 1 ? '1 other user' : `${otherHolderCount} other users`;

  if (otherHolderCount > 0) places.push(`the collections of ${otherUsers}`);

  return places.join(', ');
}

// Where the funko sits, seen from the user deleting it: their own collections by name, and every other user only
// as a number.
type FunkoHolders = { ownCollectionNames: string[]; holderIds: number[]; otherHolderCount: number };

async function findHolders(userId: number, funkoId: number): Promise<FunkoHolders> {
  const [collectionsByFunko, holderIds] = await Promise.all([
    funkosRepository.collectionsByFunkoIds(userId, [funkoId]),
    funkosRepository.findHolderIds(funkoId),
  ]);
  const ownCollectionNames = (collectionsByFunko.get(funkoId) ?? []).map((collection) => collection.name);
  const otherHolderCount = holderIds.filter((holderId) => holderId !== userId).length;

  return { ownCollectionNames, holderIds, otherHolderCount };
}

// A funko in a collection stays unless `force` is set, and taking it from other users needs a reason to tell them.
function assertCanDeleteFrom(holders: FunkoHolders, force: boolean, reason: string | undefined): void {
  const isInCollections = holders.holderIds.length > 0;
  const isInOtherUsersCollections = holders.otherHolderCount > 0;

  if (isInCollections && !force) {
    const places = describeCollections(holders.ownCollectionNames, holders.otherHolderCount);
    const howToForce = isInOtherUsersCollections ? 'force=true and a reason' : 'force=true';

    throw new HeldByUsersError(
      `The funko is in ${places}. Send ${howToForce} to remove it from them and delete it`,
      holders.holderIds.length,
    );
  }

  if (isInOtherUsersCollections && !reason) throw new BadRequestError(REASON_NEEDED_MESSAGE);
}

// Deletes the funko (with its items when it has any) and answers the users whose items went.
async function deleteRows(id: number, isInCollections: boolean, deleter: ForcedDeleter): Promise<number[]> {
  if (!isInCollections) {
    const deleted = await funkosRepository.delete(id);

    if (!deleted) throw new NotFoundError(ENTITY, id);

    return [];
  }

  const deleted = await funkosRepository.deleteWithItems(id, deleter);

  if (!deleted) throw new NotFoundError(ENTITY, id);

  if (deleted.isRefused) throw new BadRequestError(REASON_NEEDED_MESSAGE);

  return deleted.holderIds;
}

// A funko inside anyone's collection is kept unless `force` is set; then every item of it goes with it, and when
// other users had it, each user who had it (the one deleting too, if they had it) is told why. Files go after the
// rows. An admin deletes any funko; a member only their own submission (which only sits in their own collections).
export async function deleteFunko(
  user: SignedInUser,
  id: number,
  { force }: DeleteFunkoQuery,
  body: DeleteFunko | null,
): Promise<void> {
  const funko = assertCanEditFunko(user, id, await funkosRepository.findById(id));
  const holders = await findHolders(user.userId, id);
  const reason = body?.reason;

  assertCanDeleteFrom(holders, force, reason);

  const isInCollections = holders.holderIds.length > 0;
  const removedFrom = await deleteRows(id, isInCollections, { userId: user.userId, hasReason: reason !== undefined });

  await removeFunkoFolder(id);
  log.info({ funkoId: id, force, holderCount: removedFrom.length }, 'funko deleted');

  const isRemovedFromOthers = removedFrom.some((holderId) => holderId !== user.userId);

  if (isRemovedFromOthers && reason) await notifyFunkoRemoved(removedFrom, funko.name, reason);
}

// For other modules (collection items): summaries keyed by id, with the primary image resolved.
export async function getFunkoSummaries(ids: number[]): Promise<Map<number, FunkoSummary>> {
  const uniqueIds = [...new Set(ids)];
  const [rows, primaryImages] = await Promise.all([
    funkosRepository.findManyByIds(uniqueIds),
    funkosRepository.primaryImagesByFunkoIds(uniqueIds),
  ]);

  return new Map(rows.map((row) => [row.id, toSummary(row, primaryImages.get(row.id))]));
}

// For other modules (collection items): one summary of a funko in the catalogue `userId` browses (approved, or
// their own waiting submission), or NotFoundError.
export async function getFunkoSummary(userId: number, id: number): Promise<FunkoSummary> {
  const row = await funkosRepository.findById(id);

  if (!row || !isInCatalogueOf(userId, row)) throw new NotFoundError(ENTITY, id);

  const primaryImages = await funkosRepository.primaryImagesByFunkoIds([id]);

  return toSummary(row, primaryImages.get(id));
}

// For other modules (submissions): funko rows they read themselves, each beside its summary with the primary image
// resolved. One image query for them all.
export async function getFunkoSummariesOf<Row extends FunkoRow>(rows: Row[]): Promise<[Row, FunkoSummary][]> {
  const primaryImages = await funkosRepository.primaryImagesByFunkoIds(rows.map((row) => row.id));

  return rows.map((row) => [row, toSummary(row, primaryImages.get(row.id))]);
}
