import { normaliseBarcode } from '../../lib/barcode.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { removeFunkoFolder, sizeUrl } from '../../lib/imageStorage.ts';
import { logger } from '../../lib/logger.ts';
import type { SubmitterScope } from '../../lib/catalogueVisibility.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import { isUsableCategory } from '../categories/categories.service.ts';
import { isUsableSeries } from '../series/series.service.ts';
import type {
  ListSubmissionsQuery,
  SubmissionListResponse,
  SubmissionResponse,
  SubmissionStatus,
} from '../submissions/submissions.type.ts';
import { assertCanEditFunko, canSeeFunko, isInCatalogueOf } from './funkos.access.ts';
import { getImages } from './images/funkoImages.service.ts';
import {
  funkosRepository,
  type CollectionSummaryRow,
  type FunkoIdentity,
  type FunkoRow,
  type ListedFunkoRow,
  type PrimaryImageRow,
} from './funkos.repository.ts';
import type {
  CreateFunko,
  DeleteFunkoQuery,
  FunkoDetailResponse,
  FunkoListResponse,
  FunkoResponse,
  ListFunkosQuery,
  UpdateFunko,
} from './funkos.schema.ts';
import type { FunkoSummary, PrimaryImageSummary } from './funkos.type.ts';

const ENTITY = 'Funko';

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

// Whose waiting categories and series a funko may use: its sender's while it waits, nobody's once approved.
function referenceOwnerOf(funko: FunkoStanding): number | null {
  return funko.status === 'WAITING' ? funko.submittedById : null;
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

export async function getFunko(user: SignedInUser, id: number): Promise<FunkoDetailResponse> {
  const row = await funkosRepository.findById(id);

  if (!row || !canSeeFunko(user, row)) throw new NotFoundError(ENTITY, id);

  const [response, images] = await Promise.all([toSingleResponse(user.userId, row), getImages(id)]);

  return { ...response, images };
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

  return toSingleResponse(user.userId, row);
}

// An admin changes any funko; a member only their own waiting submission.
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

  const row = await funkosRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toSingleResponse(user.userId, row);
}

// The user's own collections by name; anyone else's only as "other users' collections", never whose.
function describeCollections(ownCollectionNames: string[], isInOtherUsersCollections: boolean): string {
  const places = ownCollectionNames.map((name) => `"${name}"`);

  if (isInOtherUsersCollections) places.push("other users' collections");

  return places.join(', ');
}

// A funko inside anyone's collection is kept unless `force` is set; then every item of it goes with it. Files go
// after the rows. An admin deletes any funko; a member only their own waiting submission (which only sits in their
// own collections).
export async function deleteFunko(user: SignedInUser, id: number, { force }: DeleteFunkoQuery): Promise<void> {
  assertCanEditFunko(user, id, await funkosRepository.findById(id));

  const userId = user.userId;

  const [collectionsByFunko, itemCount, otherUsersItemCount] = await Promise.all([
    funkosRepository.collectionsByFunkoIds(userId, [id]),
    funkosRepository.countItems(id),
    funkosRepository.countOtherUsersItems(userId, id),
  ]);
  const ownCollections = collectionsByFunko.get(id) ?? [];
  const isInCollections = itemCount > 0;

  if (isInCollections && !force) {
    const isInOtherUsersCollections = otherUsersItemCount > 0;
    const names = describeCollections(
      ownCollections.map((collection) => collection.name),
      isInOtherUsersCollections,
    );

    throw new ConflictError(`The funko is in ${names}. Send force=true to remove it from them and delete it`);
  }

  const deleted = isInCollections ? await funkosRepository.deleteWithItems(id) : await funkosRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);

  await removeFunkoFolder(id);
  log.info({ funkoId: id, force, removedItems: itemCount }, 'funko deleted');
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

function toSubmission(row: FunkoRow, primaryImage: PrimaryImageRow | undefined): SubmissionResponse {
  return {
    ...toSummary(row, primaryImage),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// For the submissions module: what `userId` sent in, whatever became of it.
export async function getSubmittedFunkos(userId: number, query: ListSubmissionsQuery): Promise<SubmissionListResponse> {
  const { data, totalResultNumber } = await funkosRepository.listSubmissions(userId, query);
  const primaryImages = await funkosRepository.primaryImagesByFunkoIds(data.map((row) => row.id));
  const submissions = data.map((row) => toSubmission(row, primaryImages.get(row.id)));

  return { data: submissions, totalResultNumber, currentPage: query.page };
}
