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

export async function getTags(query: ListTagsQuery): Promise<TagListResponse> {
  const { data, totalResultNumber } = await tagsRepository.list(query);

  return { data: data.map(toResponse), totalResultNumber, currentPage: query.page };
}

export async function getTag(id: number): Promise<TagResponse> {
  const row = await tagsRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

export async function addTag(data: CreateTag): Promise<TagResponse> {
  const row = await tagsRepository.create(data);

  return toResponse(row);
}

export async function updateTag(id: number, data: UpdateTag): Promise<TagResponse> {
  const row = await tagsRepository.update(id, data);

  if (!row) throw new NotFoundError(ENTITY, id);

  return toResponse(row);
}

// Deleting a tag removes it from every item (cascade on the junction); the items themselves stay.
export async function deleteTag(id: number): Promise<void> {
  const deleted = await tagsRepository.delete(id);

  if (!deleted) throw new NotFoundError(ENTITY, id);
}
