import { NotFoundError } from '../../lib/httpErrors.ts';
import { tagsRepository, type TagRow } from './tags.repository.ts';
import type { CreateTag, ListTagsQuery, TagListResponse, TagResponse, UpdateTag } from './tags.schema.ts';

const ENTITY = 'Tag';

function toResponse(row: TagRow): TagResponse {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    itemCount: row.itemCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Every function works on one user's tags only (`userId`, the signed-in user). Another user's tag answers 404, the
// same as one that does not exist, so its id gives nothing away.
export async function getTags(userId: number, query: ListTagsQuery): Promise<TagListResponse> {
  const { data, totalResultNumber } = await tagsRepository.list(userId, query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getTag(userId: number, id: number): Promise<TagResponse> {
  const row = await tagsRepository.findById(userId, id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addTag(userId: number, data: CreateTag): Promise<TagResponse> {
  const row = await tagsRepository.create(userId, data);

  return toResponse(row);
}

export async function updateTag(userId: number, id: number, data: UpdateTag): Promise<TagResponse> {
  const row = await tagsRepository.update(userId, id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Deleting a tag removes it from every item (cascade on the junction); the items themselves stay.
export async function deleteTag(userId: number, id: number): Promise<void> {
  const deleted = await tagsRepository.delete(userId, id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}

// For another module about to put tags on the user's item: NotFoundError (404) unless every id is one of the user's
// own tags. Another user's tag is not found, the same as one that does not exist.
export async function assertOwnTags(userId: number, ids: number[]): Promise<void> {
  if (ids.length === 0) return;

  const ownIds = await tagsRepository.ownIds(userId, ids);
  const missingIds = [...new Set(ids)].filter((id) => !ownIds.has(id));

  if (missingIds.length > 0) throw new NotFoundError(ENTITY, missingIds.join(', '));
}
