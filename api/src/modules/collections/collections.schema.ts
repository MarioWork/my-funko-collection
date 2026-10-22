import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { COLLECTION_SORT_FIELDS, collections } from '../../db/schema/collections.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';

export const COLLECTION_NAME_MAX_LENGTH = 100;
export const COLLECTION_NOTES_MAX_LENGTH = 2000;

export const CollectionParamsSchema = z.object({
  collectionId: z.coerce.number().int().positive(),
});

const CollectionInsertSchema = createInsertSchema(collections, {
  name: (schema) => schema.trim().min(1).max(COLLECTION_NAME_MAX_LENGTH),
  notes: (schema) => schema.trim().max(COLLECTION_NOTES_MAX_LENGTH),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const CreateCollectionSchema = z.strictObject(CollectionInsertSchema.shape);

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
