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

export async function getCollections(query: ListCollectionsQuery): Promise<CollectionListResponse> {
  const { data, totalResultNumber } = await collectionsRepository.list(query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getCollection(id: number): Promise<CollectionResponse> {
  const row = await collectionsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addCollection(data: CreateCollection): Promise<CollectionResponse> {
  const row = await collectionsRepository.create(data);

  if (!row) throw new NotFoundError(ENTITY, 'just created');

  return toResponse(row);
}

// Unsetting the default directly is refused: make another collection the default instead, which moves the flag.
export async function updateCollection(id: number, data: UpdateCollection): Promise<CollectionResponse> {
  const current = await collectionsRepository.findById(id);

  if (!current) throw new NotFoundError(ENTITY, id);

  const isUnsettingDefault = current.isDefault && data.isDefault === false;

  if (isUnsettingDefault) throw new ConflictError('Set another collection as default instead of unsetting this one');

  const row = await collectionsRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Items go with the collection (cascade); the funkos stay. The default collection cannot be deleted.
export async function deleteCollection(id: number): Promise<void> {
  const current = await collectionsRepository.findById(id);

  if (!current) throw new NotFoundError(ENTITY, id);
  if (current.isDefault) throw new ConflictError('The default collection cannot be deleted');

  await collectionsRepository.delete(id);
}

export async function assertCollectionExists(id: number): Promise<void> {
  const row = await collectionsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);
}
