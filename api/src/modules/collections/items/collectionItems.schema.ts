import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { ITEM_CONDITIONS, ITEM_SORT_FIELDS, collectionItems } from '../../../db/schema/collectionItems.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { ContainsQuerySchema, IdListQuerySchema, IsoDateSchema } from '../../../lib/queryParams.ts';
import { FunkoSummarySchema } from '../../funkos/funkoSummary.schema.ts';

export const ITEM_NOTES_MAX_LENGTH = 2000;
export const MAX_QUANTITY = 1000;
export const CURRENCY_LENGTH = 3;
export const MAX_TAGS_PER_ITEM = 20;

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export const CollectionItemParamsSchema = z.object({
  collectionId: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

const TagIdsSchema = z.array(z.number().int().positive()).max(MAX_TAGS_PER_ITEM);

const ItemInsertSchema = createInsertSchema(collectionItems, {
  funkoId: (schema) => schema.int().positive(),
  quantity: (schema) => schema.int().min(1).max(MAX_QUANTITY),
  purchasePriceCents: (schema) => schema.int().min(0),
  purchaseCurrency: (schema) => schema.length(CURRENCY_LENGTH).regex(CURRENCY_PATTERN),
  purchasedAt: () => IsoDateSchema,
  notes: (schema) => schema.trim().max(ITEM_NOTES_MAX_LENGTH),
}).omit({ id: true, collectionId: true, createdAt: true, updatedAt: true });

export const CreateCollectionItemSchema = z.strictObject({
  ...ItemInsertSchema.shape,
  tagIds: TagIdsSchema.optional(),
});

// A patch never changes the funko: delete the item and add another, or move it to a different collection.
export const UpdateCollectionItemSchema = CreateCollectionItemSchema.omit({ funkoId: true }).partial();

export const MoveCollectionItemSchema = z.strictObject({
  toCollectionId: z.number().int().positive(),
});

export const ListCollectionItemsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(ITEM_SORT_FIELDS).default('CREATION_DATE'),
  name: ContainsQuerySchema,
  funkoId: IdListQuerySchema.optional(),
  tagId: IdListQuerySchema.optional(),
  categoryId: IdListQuerySchema.optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  purchasedFrom: IsoDateSchema.optional(),
  purchasedTo: IsoDateSchema.optional(),
});

// The cross-collection list (`GET /items`) adds the collection filter the scoped list takes from the path.
export const ListAllItemsQuerySchema = ListCollectionItemsQuerySchema.extend({
  collectionId: IdListQuerySchema.optional(),
});

export const CollectionItemResponseSchema = z
  .object({
    id: z.number().int(),
    collection: z.object({ id: z.number().int(), name: z.string() }),
    funko: FunkoSummarySchema,
    quantity: z.number().int(),
    condition: z.enum(ITEM_CONDITIONS).nullable(),
    purchasePriceCents: z.number().int().nullable(),
    purchaseCurrency: z.string(),
    purchasedAt: z.string().nullable(),
    notes: z.string().nullable(),
    tags: z.array(z.object({ id: z.number().int(), name: z.string() })),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'CollectionItem' });

export const CollectionItemListResponseSchema = paginatedResponseSchema(CollectionItemResponseSchema);

export type CreateCollectionItem = z.infer<typeof CreateCollectionItemSchema>;
export type UpdateCollectionItem = z.infer<typeof UpdateCollectionItemSchema>;
export type MoveCollectionItem = z.infer<typeof MoveCollectionItemSchema>;
export type ListCollectionItemsQuery = z.infer<typeof ListCollectionItemsQuerySchema>;
export type ListAllItemsQuery = z.infer<typeof ListAllItemsQuerySchema>;
export type CollectionItemResponse = z.infer<typeof CollectionItemResponseSchema>;
export type CollectionItemListResponse = z.infer<typeof CollectionItemListResponseSchema>;
