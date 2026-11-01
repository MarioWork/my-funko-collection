import { InternalError } from '../../../lib/errors.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import { getFunkoSummaries, getFunkoSummary } from '../../funkos/basics/basics.service.ts';
import type { FunkoSummary } from '../../funkos/funkos.type.ts';
import { assertOwnTags } from '../../tags/tags.service.ts';
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

// Both answer NotFoundError (404) through the other module's get when the id does not exist. The collection one
// answers it as well for another user's collection: every item route works inside the signed-in user's own.
async function assertCollectionExists(userId: number, collectionId: number): Promise<void> {
  await getCollection(userId, collectionId);
}

// A funko the user sees in the catalogue: approved, or one they sent in themselves.
async function assertFunkoExists(userId: number, funkoId: number): Promise<void> {
  await getFunkoSummary(userId, funkoId);
}

async function assertNotAlreadyInCollection(collectionId: number, funkoId: number): Promise<void> {
  const existing = await collectionItemsRepository.findIdByFunko(collectionId, funkoId);

  if (existing) throw new ConflictError('This funko is already in the collection', existing.id);
}

// The signed-in user's item, or NotFoundError: one in another user's collection is not found either.
async function findOwnItem(userId: number, collectionId: number, itemId: number): Promise<ItemRow> {
  const current = await collectionItemsRepository.findById(userId, collectionId, itemId);

  if (!current) throw new NotFoundError(ENTITY, itemId);

  return current;
}

export async function getCollectionItems(
  userId: number,
  collectionId: number,
  query: ListCollectionItemsQuery,
): Promise<CollectionItemListResponse> {
  await assertCollectionExists(userId, collectionId);

  return getAllItems(userId, { ...query, collectionId: [collectionId] });
}

// Only the signed-in user's items: a collectionId of another user's narrows the list to nothing.
export async function getAllItems(userId: number, query: ListAllItemsQuery): Promise<CollectionItemListResponse> {
  const { data, totalResultNumber } = await collectionItemsRepository.list(userId, query);

  return { data: await toResponses(data), totalResultNumber, currentPage: query.page };
}

export async function getCollectionItem(
  userId: number,
  collectionId: number,
  itemId: number,
): Promise<CollectionItemResponse> {
  const row = await collectionItemsRepository.findById(userId, collectionId, itemId);

  return toSingleResponse(row, itemId);
}

export async function addCollectionItem(
  userId: number,
  collectionId: number,
  { tagIds, ...data }: CreateCollectionItem,
): Promise<CollectionItemResponse> {
  await assertCollectionExists(userId, collectionId);
  await assertFunkoExists(userId, data.funkoId);
  await assertOwnTags(userId, tagIds ?? []);
  await assertNotAlreadyInCollection(collectionId, data.funkoId);

  const row = await collectionItemsRepository.create({ ...data, collectionId }, [...new Set(tagIds ?? [])]);

  if (!row) throw new InternalError('The collection item was not found right after its insert');

  return toSingleResponse(row, row.id);
}

// `tagIds` replaces the whole set; leaving it out keeps the tags as they are. Only the user's own tags go on their
// items: another user's tag answers 404, like one that does not exist.
export async function updateCollectionItem(
  userId: number,
  collectionId: number,
  itemId: number,
  { tagIds, ...data }: UpdateCollectionItem,
): Promise<CollectionItemResponse> {
  await findOwnItem(userId, collectionId, itemId);
  await assertOwnTags(userId, tagIds ?? []);

  const row = await collectionItemsRepository.update(userId, itemId, data, tagIds ? [...new Set(tagIds)] : undefined);

  return toSingleResponse(row, itemId);
}

// Wishlist → Owned: the row changes collection and keeps its tags, notes and purchase data. Both collections must
// be the signed-in user's.
export async function moveCollectionItem(
  userId: number,
  collectionId: number,
  itemId: number,
  { toCollectionId }: MoveCollectionItem,
): Promise<CollectionItemResponse> {
  const current = await findOwnItem(userId, collectionId, itemId);

  if (toCollectionId === collectionId) throw new BadRequestError('The item is already in that collection');

  await assertCollectionExists(userId, toCollectionId);
  await assertNotAlreadyInCollection(toCollectionId, current.funkoId);

  const row = await collectionItemsRepository.move(userId, itemId, toCollectionId);

  return toSingleResponse(row, itemId);
}

export async function deleteCollectionItem(userId: number, collectionId: number, itemId: number): Promise<void> {
  const deleted = await collectionItemsRepository.delete(userId, collectionId, itemId);

  if (!deleted) throw new NotFoundError(ENTITY, itemId);
}
