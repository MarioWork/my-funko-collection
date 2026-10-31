import { InternalError } from '../../lib/errors.ts';
import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { collectionsRepository, type CollectionRow } from './collections.repository.ts';
import type {
  CollectionListResponse,
  CollectionResponse,
  CreateCollection,
  ListCollectionsQuery,
  UpdateCollection,
} from './collections.schema.ts';

const ENTITY = 'Collection';

function toResponse(row: CollectionRow): CollectionResponse {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    isDefault: row.isDefault,
    itemCount: row.itemCount,
    totalQuantity: row.totalQuantity,
    totalSpentCents: row.totalSpentCents,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Every function works on one user's collections only (`userId`, the signed-in user). Another user's collection
// answers 404, the same as one that does not exist, so its id gives nothing away.
export async function getCollections(userId: number, query: ListCollectionsQuery): Promise<CollectionListResponse> {
  const { data, totalResultNumber } = await collectionsRepository.list(userId, query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getCollection(userId: number, id: number): Promise<CollectionResponse> {
  const row = await collectionsRepository.findById(userId, id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addCollection(userId: number, data: CreateCollection): Promise<CollectionResponse> {
  const row = await collectionsRepository.create(userId, data);

  if (!row) throw new InternalError('The collection was not found right after its insert');

  return toResponse(row);
}

// Unsetting the default directly is refused: make another collection the default instead, which moves the flag.
export async function updateCollection(
  userId: number,
  id: number,
  data: UpdateCollection,
): Promise<CollectionResponse> {
  const current = await collectionsRepository.findById(userId, id);

  if (!current) throw new NotFoundError(ENTITY, id);

  const isUnsettingDefault = current.isDefault && data.isDefault === false;

  if (isUnsettingDefault) throw new ConflictError('Set another collection as default instead of unsetting this one');

  const row = await collectionsRepository.update(userId, id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Items go with the collection (cascade); the funkos stay. The default collection cannot be deleted.
export async function deleteCollection(userId: number, id: number): Promise<void> {
  const current = await collectionsRepository.findById(userId, id);

  if (!current) throw new NotFoundError(ENTITY, id);
  if (current.isDefault) throw new ConflictError('The default collection cannot be deleted');

  await collectionsRepository.delete(userId, id);
}
