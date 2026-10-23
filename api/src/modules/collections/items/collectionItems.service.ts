import { InternalError } from '../../../lib/errors.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import { getFunkoSummaries, getFunkoSummary } from '../../funkos/funkos.service.ts';
import type { FunkoSummary } from '../../funkos/funkos.type.ts';
import { getCollection } from '../collections.service.ts';
import { collectionItemsRepository, type ItemRow, type TagRow } from './collectionItems.repository.ts';
import type {
  CollectionItemListResponse,
  CollectionItemResponse,
  CreateCollectionItem,
  ListAllItemsQuery,
  ListCollectionItemsQuery,
  MoveCollectionItem,
  UpdateCollectionItem,
} from './collectionItems.schema.ts';

const ENTITY = 'Collection item';

function toResponse(row: ItemRow, funko: FunkoSummary, itemTags: TagRow[]): CollectionItemResponse {
  return {
    id: row.id,
    collection: { id: row.collectionId, name: row.collectionName },
    funko,
    quantity: row.quantity,
    condition: row.condition,
    purchasePriceCents: row.purchasePriceCents,
    purchaseCurrency: row.purchaseCurrency,
    purchasedAt: row.purchasedAt,
    notes: row.notes,
    tags: itemTags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Funko summaries and tags for a whole page come from two queries, not two per row.
async function toResponses(rows: ItemRow[]): Promise<CollectionItemResponse[]> {
  const [funkosById, tagsByItem] = await Promise.all([
    getFunkoSummaries(rows.map((row) => row.funkoId)),
    collectionItemsRepository.tagsByItemIds(rows.map((row) => row.id)),
  ]);

  return rows.flatMap((row) => {
    const funko = funkosById.get(row.funkoId);

    return funko ? [toResponse(row, funko, tagsByItem.get(row.id) ?? [])] : [];
  });
}

async function toSingleResponse(row: ItemRow | undefined, id: number): Promise<CollectionItemResponse> {
  if (!row) throw new NotFoundError(ENTITY, id);

  const [response] = await toResponses([row]);

  if (!response) throw new NotFoundError(ENTITY, id);

  return response;
}

// Both answer NotFoundError (404) through the other module's get when the id does not exist.
async function assertCollectionExists(collectionId: number): Promise<void> {
  await getCollection(collectionId);
}

async function assertFunkoExists(funkoId: number): Promise<void> {
  await getFunkoSummary(funkoId);
}

async function assertTagsExist(tagIds: number[] | undefined): Promise<void> {
  if (!tagIds || tagIds.length === 0) return;

  const uniqueIds = [...new Set(tagIds)];
  const found = await collectionItemsRepository.countExistingTags(uniqueIds);

  if (found !== uniqueIds.length) throw new BadRequestError('One or more tagIds do not exist');
}

async function assertNotAlreadyInCollection(collectionId: number, funkoId: number): Promise<void> {
  const existing = await collectionItemsRepository.findIdByFunko(collectionId, funkoId);

  if (existing) throw new ConflictError('This funko is already in the collection', existing.id);
}

export async function getCollectionItems(
  collectionId: number,
  query: ListCollectionItemsQuery,
): Promise<CollectionItemListResponse> {
  await assertCollectionExists(collectionId);

  return getAllItems({ ...query, collectionId: [collectionId] });
}

export async function getAllItems(query: ListAllItemsQuery): Promise<CollectionItemListResponse> {
  const { data, totalResultNumber } = await collectionItemsRepository.list(query);

  return { data: await toResponses(data), totalResultNumber, currentPage: query.page };
}

export async function getCollectionItem(collectionId: number, itemId: number): Promise<CollectionItemResponse> {
  const row = await collectionItemsRepository.findById(collectionId, itemId);

  return toSingleResponse(row, itemId);
}

export async function addCollectionItem(
  collectionId: number,
  { tagIds, ...data }: CreateCollectionItem,
): Promise<CollectionItemResponse> {
  await assertCollectionExists(collectionId);
  await assertFunkoExists(data.funkoId);
  await assertTagsExist(tagIds);
  await assertNotAlreadyInCollection(collectionId, data.funkoId);

  const row = await collectionItemsRepository.create({ ...data, collectionId }, [...new Set(tagIds ?? [])]);

  if (!row) throw new InternalError('The collection item was not found right after its insert');

  return toSingleResponse(row, row.id);
}

// `tagIds` replaces the whole set; leaving it out keeps the tags as they are.
export async function updateCollectionItem(
  collectionId: number,
  itemId: number,
  { tagIds, ...data }: UpdateCollectionItem,
): Promise<CollectionItemResponse> {
  const current = await collectionItemsRepository.findById(collectionId, itemId);

  if (!current) throw new NotFoundError(ENTITY, itemId);

  await assertTagsExist(tagIds);

  const row = await collectionItemsRepository.update(itemId, data, tagIds ? [...new Set(tagIds)] : undefined);

  return toSingleResponse(row, itemId);
}

// Wishlist → Owned: the row changes collection and keeps its tags, notes and purchase data.
export async function moveCollectionItem(
  collectionId: number,
  itemId: number,
  { toCollectionId }: MoveCollectionItem,
): Promise<CollectionItemResponse> {
  const current = await collectionItemsRepository.findById(collectionId, itemId);

  if (!current) throw new NotFoundError(ENTITY, itemId);
  if (toCollectionId === collectionId) throw new BadRequestError('The item is already in that collection');

  await assertCollectionExists(toCollectionId);
  await assertNotAlreadyInCollection(toCollectionId, current.funkoId);

  const row = await collectionItemsRepository.move(itemId, toCollectionId);

  return toSingleResponse(row, itemId);
}

export async function deleteCollectionItem(collectionId: number, itemId: number): Promise<void> {
  const deleted = await collectionItemsRepository.delete(collectionId, itemId);

  if (!deleted) throw new NotFoundError(ENTITY, itemId);
}
