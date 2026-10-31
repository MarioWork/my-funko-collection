import { z } from 'zod';
import { IdParamSchema, IdSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { BooleanQuerySchema, ContainsQuerySchema, IdListQuerySchema } from '../../lib/queryParams.ts';
import { FUNKO_TYPES, FunkoSummarySchema } from './funkos.type.ts';
import { FunkoImageResponseSchema } from './images/funkoImages.type.ts';

export const FUNKO_NAME_MAX_LENGTH = 150;
export const FUNKO_NUMBER_MAX_LENGTH = 20;
export const FUNKO_EXCLUSIVE_MAX_LENGTH = 100;
export const BARCODE_MIN_LENGTH = 8;
export const BARCODE_MAX_LENGTH = 14;
export const SEARCH_QUERY_MAX_LENGTH = 200;

export const FUNKO_SORT_FIELDS = ['RELEVANCE', 'NAME', 'NUMBER', 'CREATION_DATE', 'CATEGORY', 'SERIES'] as const;
export type FunkoSortField = (typeof FUNKO_SORT_FIELDS)[number];

export const FUNKO_MATCH_FIELDS = [
  'ID',
  'NAME',
  'NUMBER',
  'BARCODE',
  'EXCLUSIVE',
  'CATEGORY',
  'SERIES',
  'TAG',
  'COLLECTION',
] as const;
export type FunkoMatchField = (typeof FUNKO_MATCH_FIELDS)[number];

const BARCODE_PATTERN = /^\d+$/;

export const FunkoParamsSchema = z.object({
  funkoId: IdParamSchema,
});

// `force=true` removes the funko from every collection first; without it a funko in a collection answers 409.
export const DeleteFunkoQuerySchema = z.object({
  force: BooleanQuerySchema.default(false),
});

export const BarcodeParamsSchema = z.object({
  barcode: z.string().trim().min(BARCODE_MIN_LENGTH).max(BARCODE_MAX_LENGTH).regex(BARCODE_PATTERN),
});

export const CreateFunkoSchema = z.strictObject({
  name: z.string().trim().min(1).max(FUNKO_NAME_MAX_LENGTH),
  number: z.string().trim().min(1).max(FUNKO_NUMBER_MAX_LENGTH),
  type: z.enum(FUNKO_TYPES).optional(),
  categoryId: IdSchema,
  // Optional: null (or left out) means no series; on a patch, null clears it.
  seriesId: IdSchema.nullable().optional(),
  isChase: z.boolean().optional(),
  exclusive: z.string().trim().max(FUNKO_EXCLUSIVE_MAX_LENGTH).optional(),
  barcode: z
    .string()
    .trim()
    .min(BARCODE_MIN_LENGTH)
    .max(BARCODE_MAX_LENGTH)
    .regex(BARCODE_PATTERN)
    .nullable()
    .optional(),
});

export const UpdateFunkoSchema = CreateFunkoSchema.partial();

// `q` searches every field; the named params each tighten one field. All are ANDed.
export const ListFunkosQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(FUNKO_SORT_FIELDS).optional(),
  q: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional(),
  name: ContainsQuerySchema,
  number: z.string().trim().min(1).max(FUNKO_NUMBER_MAX_LENGTH).optional(),
  barcode: z.string().trim().min(1).max(BARCODE_MAX_LENGTH).optional(),
  exclusive: ContainsQuerySchema,
  type: z.enum(FUNKO_TYPES).optional(),
  isChase: BooleanQuerySchema.optional(),
  categoryId: IdListQuerySchema.optional(),
  category: ContainsQuerySchema,
  seriesId: IdListQuerySchema.optional(),
  series: ContainsQuerySchema,
  tagId: IdListQuerySchema.optional(),
  tag: ContainsQuerySchema,
  collectionId: IdListQuerySchema.optional(),
  collection: ContainsQuerySchema,
  notInCollectionId: IdListQuerySchema.optional(),
  // false: in no collection at all; true: in at least one.
  hasCollections: BooleanQuerySchema.optional(),
  hasSeries: BooleanQuerySchema.optional(),
  // false: none of its items carries a tag.
  hasTags: BooleanQuerySchema.optional(),
  hasImages: BooleanQuerySchema.optional(),
});

export const CollectionSummarySchema = z.object({ id: z.number().int(), name: z.string() });

export const FunkoResponseSchema = FunkoSummarySchema.extend({
  collections: z.array(CollectionSummarySchema),
  // Present only on a `q` search: which fields the query words hit.
  matchedOn: z.array(z.enum(FUNKO_MATCH_FIELDS)).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Funko' });

export const FunkoDetailResponseSchema = FunkoResponseSchema.extend({
  images: z.array(FunkoImageResponseSchema),
}).meta({ id: 'FunkoDetail' });

export const FunkoListResponseSchema = paginatedResponseSchema(FunkoResponseSchema);

export type CreateFunko = z.infer<typeof CreateFunkoSchema>;
export type UpdateFunko = z.infer<typeof UpdateFunkoSchema>;
export type ListFunkosQuery = z.infer<typeof ListFunkosQuerySchema>;
export type DeleteFunkoQuery = z.infer<typeof DeleteFunkoQuerySchema>;
export type FunkoResponse = z.infer<typeof FunkoResponseSchema>;
export type FunkoDetailResponse = z.infer<typeof FunkoDetailResponseSchema>;
export type FunkoListResponse = z.infer<typeof FunkoListResponseSchema>;
