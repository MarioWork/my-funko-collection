import { env } from '../../config/env.ts';
import { normaliseBarcode } from '../../lib/barcode.ts';
import { isForeignKeyViolation, isUniqueViolation } from '../../lib/databaseErrors.ts';
import { BadRequestError, ConflictError, HeldByUsersError, NotFoundError } from '../../lib/httpErrors.ts';
import { copyImageFiles, removeFunkoFolder, removeImageFiles, sizeUrl } from '../../lib/imageStorage.ts';
import { logger } from '../../lib/logger.ts';
import type { SubmitterScope } from '../../lib/catalogueVisibility.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import { isUsableCategory } from '../categories/categories.service.ts';
import {
  notifyAdminsOfNewSubmission,
  notifyAdminsOfResentSubmission,
  notifyFunkoRemoved,
  notifySubmissionApproved,
  notifySubmissionMerged,
  notifySubmissionRejected,
} from '../notifications/notifications.service.ts';
import { isUsableSeries } from '../series/series.service.ts';
import type {
  DoubleMatchField,
  ListReviewQuery,
  ListSubmissionsQuery,
  PossibleDouble,
  RejectionOutcome,
  ReviewSubmissionListResponse,
  SubmissionListResponse,
  SubmissionResponse,
  SubmissionStatus,
} from '../submissions/submissions.type.ts';
import {
  assertCanEditFunko,
  canSeeFunko,
  isAdminChangingSubmission,
  isInCatalogueOf,
  isOpenSubmission,
} from './funkos.access.ts';
import { getImageFiles, getImages } from './images/funkoImages.service.ts';
import type { ImageFile } from './images/funkoImages.type.ts';
import { combineClashingItems } from './funkos.merge.ts';
import {
  imagePlanOf,
  pickedFieldsOf,
  type MergeImagePlan,
  type MergeComparableFields,
  type PickedFields,
} from './funkos.mergeChoices.ts';
import {
  funkosRepository,
  type CatalogueReferences,
  type CollectionSummaryRow,
  type DoubleCandidateRow,
  type DoubleProbe,
  type FunkoIdentity,
  type ForcedDeleter,
  type FunkoRow,
  type ListedFunkoRow,
  type MergeChange,
  type MergeOutcome,
  type PrimaryImageRow,
  type SubmissionRow,
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
import type { FunkoSummary, MergeChoices, PrimaryImageSummary } from './funkos.type.ts';

const ENTITY = 'Funko';
const NOT_WAITING_MESSAGE = 'Only a waiting submission can be approved, rejected or merged';
const SELF_MERGE_MESSAGE = 'A submission cannot be merged into itself';
const NOT_REJECTED_MESSAGE = 'Only a rejected submission can be sent again';
const REASON_NEEDED_MESSAGE = 'Removing a funko other users have needs a reason to tell them';
const CATALOGUE_HAS_FUNKO_MESSAGE = 'The catalogue already has this funko. Reject this submission, or change it first';
const CATALOGUE_HAS_BARCODE_MESSAGE =
  'This barcode belongs to another funko in the catalogue. Reject this submission, or change it first';
const PICK_HAS_FUNKO_MESSAGE =
  'With the picked details, this would be the same as another funko in the catalogue. Keep more of the original entry';
const PICK_HAS_BARCODE_MESSAGE =
  'The submission’s barcode belongs to another funko in the catalogue. Keep the original entry’s barcode';
const MERGE_CLASH_MESSAGE =
  'The catalogue now has a funko that clashes with the picked details. Reload and check them again';
const CATALOGUE_CLASH_MESSAGE =
  'The catalogue now has a funko, category or series that clashes with this submission. Reload and check it again';

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

// Where a funko stands: in the catalogue, or a submission and who sent it.
type FunkoStanding = { status: SubmissionStatus; submittedById: number | null };

// A category or series a body points at that the funko may not use is the caller's input error: 400. A funko may
// use the approved ones, and a waiting submission also the ones its sender typed in (`submitterId`, null for a
// funko in the catalogue). Another member's waiting one answers like one that does not exist.
async function assertCategoryUsable(categoryId: number, submitterId: number | null): Promise<void> {
  const isUsable = await isUsableCategory(categoryId, submitterId);

  if (!isUsable) throw new BadRequestError(`Category ${categoryId} does not exist`);
}

// A series id in a body is checked only when one is given: null and a missing key both mean "no series".
async function assertSeriesUsableIfGiven(
  seriesId: number | null | undefined,
  submitterId: number | null,
): Promise<void> {
  const hasSeries = seriesId !== undefined && seriesId !== null;
  const isUsable = hasSeries ? await isUsableSeries(seriesId, submitterId) : true;

  if (!isUsable) throw new BadRequestError(`Series ${seriesId} does not exist`);
}

// Whose waiting categories and series a funko may use: its sender's while it waits (or is rejected, for them to fix
// and send again), nobody's once approved.
function referenceOwnerOf(funko: FunkoStanding): number | null {
  return isOpenSubmission(funko) ? funko.submittedById : null;
}

function toSeries(row: FunkoRow): FunkoSummary['series'] {
  if (row.seriesId === null || row.seriesName === null) return null;

  return { id: row.seriesId, name: row.seriesName };
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
    series: toSeries(row),
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

function identityOf(row: FunkoRow): FunkoIdentity {
  return {
    categoryId: row.categoryId,
    number: row.number,
    name: row.name,
    isChase: row.isChase,
    exclusive: row.exclusive,
  };
}

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
// so the member is pointed at the funko already there. Rejected and merged ones are not checked.
async function assertUnique(
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
  await assertSeriesUsableIfGiven(data.seriesId, referenceOwnerOf(standing));
  await assertUnique(standing, identity, data.barcode);

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
  await assertSeriesUsableIfGiven(data.seriesId, referenceOwnerOf(current));
  await assertUnique(current, identity, data.barcode === undefined ? current.barcode : data.barcode, id);

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

function toSubmission(row: SubmissionRow, primaryImage: PrimaryImageRow | undefined): SubmissionResponse {
  return {
    ...toSummary(row, primaryImage),
    status: row.status,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    changedByAdminAt: row.changedByAdminAt?.toISOString() ?? null,
    mergedInto: row.mergedInto,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function toSingleSubmission(id: number): Promise<SubmissionResponse> {
  const row = await funkosRepository.findSubmission(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const primaryImages = await funkosRepository.primaryImagesByFunkoIds([id]);

  return toSubmission(row, primaryImages.get(id));
}

// For the submissions module: what `userId` sent in, whatever became of it.
export async function getSubmittedFunkos(userId: number, query: ListSubmissionsQuery): Promise<SubmissionListResponse> {
  const { data, totalResultNumber } = await funkosRepository.listSubmissions(userId, query);
  const primaryImages = await funkosRepository.primaryImagesByFunkoIds(data.map((row) => row.id));
  const submissions = data.map((row) => toSubmission(row, primaryImages.get(row.id)));

  return { data: submissions, totalResultNumber, currentPage: query.page };
}

const SAME_TEXT = new Intl.Collator('en', { sensitivity: 'accent' });

// Why `candidate` may be the same funko as `probe`: the same barcode, or the same number in a category of the same
// name (any case, as the query matched it).
function doubleMatchesOf(probe: DoubleProbe, candidate: DoubleCandidateRow): DoubleMatchField[] {
  const isSameBarcode = probe.barcode !== null && probe.barcode === candidate.barcode;
  const isSameNumber = probe.number === candidate.number;
  const isSameCategory = SAME_TEXT.compare(probe.categoryName, candidate.category.name) === 0;
  const matches: DoubleMatchField[] = [];

  if (isSameBarcode) matches.push('BARCODE');
  if (isSameNumber && isSameCategory) matches.push('NUMBER_AND_CATEGORY');

  return matches;
}

function possibleDoublesOf(probe: DoubleProbe, candidates: DoubleCandidateRow[]): PossibleDouble[] {
  return candidates.flatMap((candidate) => {
    const matchedOn = candidate.id === probe.id ? [] : doubleMatchesOf(probe, candidate);

    if (matchedOn.length === 0) return [];

    return [
      {
        id: candidate.id,
        name: candidate.name,
        number: candidate.number,
        isChase: candidate.isChase,
        exclusive: candidate.exclusive,
        status: candidate.status,
        matchedOn,
      },
    ];
  });
}

// "Maybe a double", for the waiting ones only: every other approved or waiting funko that shares the barcode, or the
// number and category. One query for the whole page.
async function possibleDoublesByFunko(rows: SubmissionRow[]): Promise<Map<number, PossibleDouble[]>> {
  const probes: DoubleProbe[] = rows
    .filter((row) => row.status === 'WAITING')
    .map((row) => ({ id: row.id, barcode: row.barcode, number: row.number, categoryName: row.categoryName }));
  const candidates = await funkosRepository.findDoubleCandidates(probes);

  return new Map(probes.map((probe) => [probe.id, possibleDoublesOf(probe, candidates)]));
}

// For the submissions module: every member's submissions as the admins review them, waiting or done.
export async function getReviewSubmissions(query: ListReviewQuery): Promise<ReviewSubmissionListResponse> {
  const { data, totalResultNumber } = await funkosRepository.listForReview(query);
  const ids = data.map((row) => row.id);
  const [primaryImages, doubles] = await Promise.all([
    funkosRepository.primaryImagesByFunkoIds(ids),
    possibleDoublesByFunko(data),
  ]);
  const submissions = data.map((row) => ({
    ...toSubmission(row, primaryImages.get(row.id)),
    submittedBy: row.submittedBy,
    possibleDoubles: doubles.get(row.id) ?? [],
  }));

  return { data: submissions, totalResultNumber, currentPage: query.page };
}

async function findWaitingSubmission(id: number): Promise<FunkoRow> {
  const row = await funkosRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  if (row.status !== 'WAITING') throw new ConflictError(NOT_WAITING_MESSAGE);

  return row;
}

// The clear refusals first: the same funko or barcode already in the catalogue (pointing at it). A clash that slips
// in between (another admin approving the same box at once) is the unique index's 23505, answered in words too.
async function assertFitsCatalogue(row: FunkoRow, categoryId: number): Promise<void> {
  const identity: FunkoIdentity = { ...identityOf(row), categoryId };
  const sameIdentity = await funkosRepository.findIdByIdentity(identity, CATALOGUE_SCOPE);

  if (sameIdentity) throw new ConflictError(CATALOGUE_HAS_FUNKO_MESSAGE, sameIdentity.id);

  const sameBarcode = row.barcode ? await funkosRepository.findIdByBarcode(row.barcode, CATALOGUE_SCOPE) : undefined;

  if (sameBarcode) throw new ConflictError(CATALOGUE_HAS_BARCODE_MESSAGE, sameBarcode.id);
}

async function approveOrExplain(id: number, references: CatalogueReferences): Promise<boolean> {
  try {
    return await funkosRepository.approve(id, references);
  } catch (error: unknown) {
    if (isUniqueViolation(error)) throw new ConflictError(CATALOGUE_CLASH_MESSAGE);

    throw error;
  }
}

// An admin approves a waiting submission: the funko joins the catalogue for everyone, with any waiting category and
// series of its own (one the catalogue now has by name takes their place). Refused while its identity or barcode
// clashes with the catalogue.
export async function approveSubmission(id: number): Promise<SubmissionResponse> {
  const row = await findWaitingSubmission(id);
  const references = await funkosRepository.findCatalogueReferences(id);

  if (!references) throw new NotFoundError(ENTITY, id);

  await assertFitsCatalogue(row, references.categoryId);

  const isApproved = await approveOrExplain(id, references);

  if (!isApproved) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'submission approved');

  // An orphan submission has no sender left to tell.
  if (row.submittedById !== null)
    await notifySubmissionApproved(row.submittedById, { funkoId: id, funkoName: row.name });

  return toSingleSubmission(id);
}

// An orphan submission (its sender removed) has nobody to fix it: rejecting it deletes it.
async function deleteRejectedOrphan(id: number): Promise<RejectionOutcome> {
  const isDeleted = await funkosRepository.deleteOrphan(id);

  if (!isDeleted) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'orphan submission rejected and deleted');

  return { isDeleted: true };
}

// An admin rejects a waiting submission, saying why: it stays in its sender's collections, still private, for them
// to fix and send again, or delete. An orphan submission is deleted instead.
export async function rejectSubmission(id: number, reason: string): Promise<RejectionOutcome> {
  const current = await findWaitingSubmission(id);
  const senderId = current.submittedById;

  if (senderId === null) return deleteRejectedOrphan(id);

  const row = await funkosRepository.reject(id, reason);

  if (!row) throw new ConflictError(NOT_WAITING_MESSAGE);

  log.info({ funkoId: id }, 'submission rejected');

  await notifySubmissionRejected(senderId, { funkoId: id, funkoName: current.name }, reason);

  return { isDeleted: false, submission: await toSingleSubmission(id) };
}

// The sender sends a rejected submission in again, once it fits their other waiting ones and the catalogue.
export async function resendSubmission(user: SignedInUser, id: number): Promise<SubmissionResponse> {
  const current = assertCanEditFunko(user, id, await funkosRepository.findById(id));

  if (current.status !== 'REJECTED') throw new ConflictError(NOT_REJECTED_MESSAGE);

  const waiting: FunkoStanding = { status: 'WAITING', submittedById: current.submittedById };

  await assertUnique(waiting, identityOf(current), current.barcode, id);

  const row = await funkosRepository.resend(id);

  if (!row) throw new ConflictError(NOT_REJECTED_MESSAGE);

  log.info({ funkoId: id }, 'submission sent again');

  await notifyAdminsOfResentSubmission({ funkoId: id, funkoName: current.name });

  return toSingleSubmission(id);
}

// A merge target is a funko in the catalogue other than the submission: anything else is the caller's input error.
function targetNotInCatalogue(targetId: number): BadRequestError {
  return new BadRequestError(`Funko ${targetId} is not in the catalogue`);
}

const MERGE_REFUSAL_MAP: Record<Exclude<MergeOutcome, 'MERGED'>, (targetId: number) => Error> = {
  NOT_WAITING: () => new ConflictError(NOT_WAITING_MESSAGE),
  TARGET_NOT_IN_CATALOGUE: targetNotInCatalogue,
};

// The target is checked in the transaction but not locked: one deleted in between makes the item move fail on its
// foreign key, and the merge answers as if the target had never been there. A picked value another admin gave a
// catalogue funko meanwhile is the unique index's 23505, answered in words.
async function mergeOrExplain(id: number, targetId: number, change: MergeChange): Promise<MergeOutcome> {
  try {
    return await funkosRepository.merge(id, targetId, change, combineClashingItems);
  } catch (error: unknown) {
    if (isForeignKeyViolation(error)) return 'TARGET_NOT_IN_CATALOGUE';

    if (isUniqueViolation(error)) throw new ConflictError(MERGE_CLASH_MESSAGE);

    throw error;
  }
}

function mergeSideOf(row: FunkoRow, references: CatalogueReferences): MergeComparableFields {
  return {
    name: row.name,
    number: row.number,
    type: row.type,
    isChase: row.isChase,
    exclusive: row.exclusive,
    barcode: row.barcode,
    ...references,
  };
}

// The fields the target takes from the submission, compared with the submission's category and series as the
// catalogue would have them.
async function pickFields(submission: FunkoRow, target: FunkoRow, choices: MergeChoices): Promise<PickedFields> {
  if (choices.fieldsFromSubmission.length === 0) return {};

  const references = await funkosRepository.findCatalogueReferences(submission.id);

  if (!references) throw new NotFoundError(ENTITY, submission.id);

  const original = mergeSideOf(target, { categoryId: target.categoryId, seriesId: target.seriesId });

  return pickedFieldsOf(original, mergeSideOf(submission, references), choices.fieldsFromSubmission);
}

// The target with the picked fields must still fit the catalogue: no other catalogue funko with the same identity or
// barcode (409 pointing at it, as approval refuses).
async function assertPickFitsCatalogue(target: FunkoRow, fields: PickedFields): Promise<void> {
  const identity: FunkoIdentity = {
    categoryId: fields.categoryId ?? target.categoryId,
    number: fields.number ?? target.number,
    name: fields.name ?? target.name,
    isChase: fields.isChase ?? target.isChase,
    exclusive: fields.exclusive ?? target.exclusive,
  };
  const sameIdentity = await funkosRepository.findIdByIdentity(identity, CATALOGUE_SCOPE);

  if (sameIdentity && sameIdentity.id !== target.id) throw new ConflictError(PICK_HAS_FUNKO_MESSAGE, sameIdentity.id);

  const sameBarcode = fields.barcode
    ? await funkosRepository.findIdByBarcode(fields.barcode, CATALOGUE_SCOPE)
    : undefined;

  if (sameBarcode && sameBarcode.id !== target.id) throw new ConflictError(PICK_HAS_BARCODE_MESSAGE, sameBarcode.id);
}

async function planImages(id: number, targetId: number, choices: MergeChoices): Promise<MergeImagePlan> {
  const [originalImages, submissionImages] = await Promise.all([getImageFiles(targetId), getImageFiles(id)]);

  return imagePlanOf(originalImages, submissionImages, choices, env.MAX_IMAGES_PER_FUNKO);
}

// Best effort, like a normal image delete: the rows are already gone or moved.
async function removeImageFilesOf(funkoId: number, images: ImageFile[]): Promise<void> {
  for (const image of images) await removeImageFiles(funkoId, image.fileKey);
}

// The merge itself, with the moving images' files copied into the target's folder first, so the target never points
// at a missing file. If a copy or the merge fails, the copies go again (removing one never written is a logged no-op)
// and nothing else changed.
async function mergeWithCopiedFiles(
  id: number,
  targetId: number,
  change: MergeChange,
  moved: ImageFile[],
): Promise<void> {
  let outcome: MergeOutcome;

  try {
    for (const image of moved) await copyImageFiles(id, targetId, image.fileKey);

    outcome = await mergeOrExplain(id, targetId, change);
  } catch (error: unknown) {
    await removeImageFilesOf(targetId, moved);
    throw error;
  }

  if (outcome === 'MERGED') return;

  await removeImageFilesOf(targetId, moved);
  throw MERGE_REFUSAL_MAP[outcome](targetId);
}

// Merges, then removes the files no row points at any more: the moved images' originals, and the removed images'.
async function mergeWithImages(
  id: number,
  targetId: number,
  fields: PickedFields,
  plan: MergeImagePlan,
): Promise<void> {
  const change: MergeChange = {
    fields,
    movedImageIds: plan.moved.map((image) => image.id),
    removedImageIds: plan.removed.map((image) => image.id),
  };

  await mergeWithCopiedFiles(id, targetId, change, plan.moved);
  await removeImageFilesOf(id, plan.moved);
  await removeImageFilesOf(targetId, plan.removed);
}

// An admin merges a waiting submission into a funko already in the catalogue: the funko takes the fields and images
// the admin picked (see funkos.mergeChoices.ts), every item of the submission moves onto it (two in one collection
// become one, see funkos.merge.ts), and the submission reads as merged into it, still private, as its sender sent it.
// Its sender is told, pointed at the catalogue funko.
export async function mergeSubmission(id: number, choices: MergeChoices): Promise<SubmissionResponse> {
  const targetId = choices.targetFunkoId;

  if (id === targetId) throw new BadRequestError(SELF_MERGE_MESSAGE);

  const row = await findWaitingSubmission(id);
  const target = await funkosRepository.findById(targetId);

  if (target?.status !== 'APPROVED') throw targetNotInCatalogue(targetId);

  const fields = await pickFields(row, target, choices);

  await assertPickFitsCatalogue(target, fields);
  await mergeWithImages(id, targetId, fields, await planImages(id, targetId, choices));

  log.info({ funkoId: id, targetFunkoId: targetId }, 'submission merged');

  // An orphan submission has no sender left to tell.
  if (row.submittedById !== null)
    await notifySubmissionMerged(row.submittedById, { funkoId: targetId, funkoName: target.name });

  return toSingleSubmission(id);
}
