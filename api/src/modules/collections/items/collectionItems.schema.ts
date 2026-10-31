import { z } from 'zod';
import { IdParamSchema, IdSchema } from '../../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { ContainsQuerySchema, IdListQuerySchema, IsoDateSchema } from '../../../lib/queryParams.ts';
import { FunkoSummarySchema } from '../../funkos/funkos.type.ts';
import { ITEM_CONDITIONS } from './collectionItems.type.ts';

export const ITEM_NOTES_MAX_LENGTH = 2000;
export const MAX_QUANTITY = 1000;
export const CURRENCY_LENGTH = 3;
export const MAX_TAGS_PER_ITEM = 20;
// The price column is a Postgres integer: 21 million in cents is far past any funko, and the cap keeps a typo a 400.
export const MAX_PRICE_CENTS = 2_147_483_647;

export const ITEM_SORT_FIELDS = [
  'NAME',
  'NUMBER',
  'CREATION_DATE',
  'UPDATE_DATE',
  'PURCHASE_DATE',
  'PURCHASE_PRICE',
] as const;
export type ItemSortField = (typeof ITEM_SORT_FIELDS)[number];

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

// Mounted under /collections/:collectionId/items.
export const CollectionItemsParamsSchema = z.object({
  collectionId: IdParamSchema,
});

export const CollectionItemParamsSchema = CollectionItemsParamsSchema.extend({
  itemId: IdParamSchema,
});

const TagIdsSchema = z.array(IdSchema).max(MAX_TAGS_PER_ITEM);

export const CreateCollectionItemSchema = z.strictObject({
  funkoId: IdSchema,
  quantity: z.number().int().min(1).max(MAX_QUANTITY).optional(),
  condition: z.enum(ITEM_CONDITIONS).nullable().optional(),
  purchasePriceCents: z.number().int().min(0).max(MAX_PRICE_CENTS).nullable().optional(),
  purchaseCurrency: z.string().length(CURRENCY_LENGTH).regex(CURRENCY_PATTERN).optional(),
  purchasedAt: IsoDateSchema.nullable().optional(),
  notes: z.string().trim().max(ITEM_NOTES_MAX_LENGTH).nullable().optional(),
  tagIds: TagIdsSchema.optional(),
});

// A patch never changes the funko: delete the item and add another, or move it to a different collection.
export const UpdateCollectionItemSchema = CreateCollectionItemSchema.omit({ funkoId: true }).partial();

export const MoveCollectionItemSchema = z.strictObject({
  toCollectionId: IdSchema,
});

export const ListCollectionItemsQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(ITEM_SORT_FIELDS).default('CREATION_DATE'),
  name: ContainsQuerySchema,
  funkoId: IdListQuerySchema.optional(),
  tagId: IdListQuerySchema.optional(),
  categoryId: IdListQuerySchema.optional(),
  seriesId: IdListQuerySchema.optional(),
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
