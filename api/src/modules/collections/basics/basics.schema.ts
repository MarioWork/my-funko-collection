import { z } from 'zod';
import { IdParamSchema } from '../../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../../lib/queryParams.ts';

export const COLLECTION_NAME_MAX_LENGTH = 100;
export const COLLECTION_NOTES_MAX_LENGTH = 2000;

export const COLLECTION_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type CollectionSortField = (typeof COLLECTION_SORT_FIELDS)[number];

export const CollectionParamsSchema = z.object({
  collectionId: IdParamSchema,
});

export const CreateCollectionSchema = z.strictObject({
  name: z.string().trim().min(1).max(COLLECTION_NAME_MAX_LENGTH),
  notes: z.string().trim().max(COLLECTION_NOTES_MAX_LENGTH).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const ListCollectionsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(COLLECTION_SORT_FIELDS).default('NAME'),
  name: ContainsQuerySchema,
});

export const CollectionResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    notes: z.string().nullable(),
    isDefault: z.boolean(),
    itemCount: z.number().int(),
    totalQuantity: z.number().int(),
    totalSpentCents: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Collection' });

export const CollectionListResponseSchema = paginatedResponseSchema(CollectionResponseSchema);

export type CreateCollection = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollection = z.infer<typeof UpdateCollectionSchema>;
export type ListCollectionsQuery = z.infer<typeof ListCollectionsQuerySchema>;
export type CollectionResponse = z.infer<typeof CollectionResponseSchema>;
export type CollectionListResponse = z.infer<typeof CollectionListResponseSchema>;
