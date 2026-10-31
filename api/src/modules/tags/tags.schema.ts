import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';

export const TAG_NAME_MAX_LENGTH = 100;
export const TAG_NOTES_MAX_LENGTH = 500;

export const TAG_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type TagSortField = (typeof TAG_SORT_FIELDS)[number];

export const TagParamsSchema = z.object({
  tagId: IdParamSchema,
});

export const CreateTagSchema = z.strictObject({
  name: z.string().trim().min(1).max(TAG_NAME_MAX_LENGTH),
  notes: z.string().trim().max(TAG_NOTES_MAX_LENGTH).nullable().optional(),
});

export const UpdateTagSchema = CreateTagSchema.partial();

export const ListTagsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(TAG_SORT_FIELDS).default('NAME'),
  name: ContainsQuerySchema,
});

export const TagResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    notes: z.string().nullable(),
    itemCount: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Tag' });

export const TagListResponseSchema = paginatedResponseSchema(TagResponseSchema);

export type CreateTag = z.infer<typeof CreateTagSchema>;
export type UpdateTag = z.infer<typeof UpdateTagSchema>;
export type ListTagsQuery = z.infer<typeof ListTagsQuerySchema>;
export type TagResponse = z.infer<typeof TagResponseSchema>;
export type TagListResponse = z.infer<typeof TagListResponseSchema>;
