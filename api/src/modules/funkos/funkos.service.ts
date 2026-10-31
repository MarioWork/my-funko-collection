import { normaliseBarcode } from '../../lib/barcode.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { removeFunkoFolder, sizeUrl } from '../../lib/imageStorage.ts';
import { logger } from '../../lib/logger.ts';
import { getCategory } from '../categories/categories.service.ts';
import { getSeries } from '../series/series.service.ts';
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

// A category or series a body points at that does not exist is the caller's input error: 400, not the 404 the
// other module's get answers for its own route.
async function assertReferenceExists(
  entity: string,
  id: number,
  getOne: (id: number) => Promise<unknown>,
): Promise<void> {
  try {
    await getOne(id);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) throw new BadRequestError(`${entity} ${id} does not exist`, { cause: error });

    throw error;
  }
}

async function assertCategoryExists(categoryId: number): Promise<void> {
  await assertReferenceExists('Category', categoryId, getCategory);
}

// A series id in a body is checked only when one is given: null and a missing key both mean "no series".
async function assertSeriesIfGiven(seriesId: number | null | undefined): Promise<void> {
  const hasSeries = seriesId !== undefined && seriesId !== null;

  if (hasSeries) await assertReferenceExists('Series', seriesId, getSeries);
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
function toResponse(row: FunkoRow | ListedFunkoRow, extras: FunkoExtras): FunkoResponse {
  const matchedOn = 'matchedOn' in row ? (row.matchedOn ?? undefined) : undefined;

  return {
    ...toSummary(row, extras.primaryImage),
    collections: extras.collections.map(({ id, name }) => ({ id, name })),
    matchedOn,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Two page-wide queries instead of two per row.
async function loadExtras(rows: FunkoRow[]): Promise<Map<number, FunkoExtras>> {
  const ids = rows.map((row) => row.id);
  const [primaryImages, collectionsByFunko] = await Promise.all([
    funkosRepository.primaryImagesByFunkoIds(ids),
    funkosRepository.collectionsByFunkoIds(ids),
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

async function toResponses(rows: (FunkoRow | ListedFunkoRow)[]): Promise<FunkoResponse[]> {
  const extras = await loadExtras(rows);

  return rows.map((row) => toResponse(row, extras.get(row.id) ?? EMPTY_EXTRAS));
}

async function toSingleResponse(row: FunkoRow): Promise<FunkoResponse> {
  const [response] = await toResponses([row]);

  if (!response) throw new NotFoundError(ENTITY, row.id);

  return response;
}

// Barcodes are kept in their 13-digit form (see lib/barcode) so a scan matches whatever was typed.
function withNormalisedBarcode<Data extends { barcode?: string | null }>(data: Data): Data {
  if (!data.barcode) return data;

  return { ...data, barcode: normaliseBarcode(data.barcode) };
}

// The duplicate guard: same (category, number, name, chase, exclusive) or same barcode answers 409 with the existing id.
async function assertUnique(
  identity: FunkoIdentity,
  barcode: string | null | undefined,
  selfId?: number,
): Promise<void> {
  const sameIdentity = await funkosRepository.findIdByIdentity(identity);
  const isOtherIdentity = sameIdentity !== undefined && sameIdentity.id !== selfId;

  if (isOtherIdentity) throw new ConflictError('This funko already exists', sameIdentity.id);

  if (!barcode) return;

  const sameBarcode = await funkosRepository.findIdByBarcode(normaliseBarcode(barcode));
  const isOtherBarcode = sameBarcode !== undefined && sameBarcode.id !== selfId;

  if (isOtherBarcode) throw new ConflictError('This barcode belongs to another funko', sameBarcode.id);
}

export async function getFunkos(query: ListFunkosQuery): Promise<FunkoListResponse> {
  const normalisedQuery = query.barcode ? { ...query, barcode: normaliseBarcode(query.barcode) } : query;
  const { data, totalResultNumber } = await funkosRepository.list(normalisedQuery);
  const responses = await toResponses(data);

  return { data: responses, totalResultNumber, currentPage: query.page };
}

export async function getFunko(id: number): Promise<FunkoDetailResponse> {
  const row = await funkosRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  const [response, images] = await Promise.all([toSingleResponse(row), getImages(id)]);

  return { ...response, images };
}

export async function getFunkoByBarcode(barcode: string): Promise<FunkoResponse> {
  const row = await funkosRepository.findByBarcode(normaliseBarcode(barcode));

  if (!row) throw new NotFoundError(ENTITY, barcode);

  return toSingleResponse(row);
}

export async function addFunko(input: CreateFunko): Promise<FunkoResponse> {
  const data = withNormalisedBarcode(input);
  const identity: FunkoIdentity = {
    categoryId: data.categoryId,
    number: data.number,
    name: data.name,
    isChase: data.isChase ?? false,
    exclusive: data.exclusive ?? '',
  };

  await assertCategoryExists(data.categoryId);
  await assertSeriesIfGiven(data.seriesId);
  await assertUnique(identity, data.barcode);

  const row = await funkosRepository.create(data);

  log.info({ funkoId: row.id }, 'funko created');

  return toSingleResponse(row);
}

export async function updateFunko(id: number, input: UpdateFunko): Promise<FunkoResponse> {
  const data = withNormalisedBarcode(input);
  const current = await funkosRepository.findById(id);

  if (!current) throw new NotFoundError(ENTITY, id);

  const identity: FunkoIdentity = {
    categoryId: data.categoryId ?? current.categoryId,
    number: data.number ?? current.number,
    name: data.name ?? current.name,
    isChase: data.isChase ?? current.isChase,
    exclusive: data.exclusive ?? current.exclusive,
  };

  if (data.categoryId !== undefined) await assertCategoryExists(data.categoryId);
  await assertSeriesIfGiven(data.seriesId);
  await assertUnique(identity, data.barcode === undefined ? current.barcode : data.barcode, id);

  const row = await funkosRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toSingleResponse(row);
}

function describeCollections(collectionNames: string[]): string {
  return collectionNames.map((name) => `"${name}"`).join(', ');
}

// A funko inside a collection is kept unless `force` is set; then its items go with it. Files go after the rows.
export async function deleteFunko(id: number, { force }: DeleteFunkoQuery): Promise<void> {
  const current = await funkosRepository.findById(id);

  if (!current) throw new NotFoundError(ENTITY, id);

  const collectionsByFunko = await funkosRepository.collectionsByFunkoIds([id]);
  const memberships = collectionsByFunko.get(id) ?? [];
  const isInCollections = memberships.length > 0;

  if (isInCollections && !force) {
    const names = describeCollections(memberships.map((membership) => membership.name));

    throw new ConflictError(`The funko is in ${names}. Send force=true to remove it from them and delete it`);
  }

  const deleted = isInCollections ? await funkosRepository.deleteWithItems(id) : await funkosRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);

  await removeFunkoFolder(id);
  log.info({ funkoId: id, force, removedFromCollections: memberships.length }, 'funko deleted');
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

// For other modules (collection items): one summary, or NotFoundError.
export async function getFunkoSummary(id: number): Promise<FunkoSummary> {
  const summaries = await getFunkoSummaries([id]);
  const summary = summaries.get(id);

  if (!summary) throw new NotFoundError(ENTITY, id);

  return summary;
}
