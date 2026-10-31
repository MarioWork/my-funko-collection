import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';
import { SUBMISSION_STATUSES } from '../submissions/submissions.type.ts';

export const CATEGORY_NAME_MAX_LENGTH = 100;

export const CATEGORY_SORT_FIELDS = ['NAME', 'CREATION_DATE'] as const;
export type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

export const CategoryParamsSchema = z.object({
  categoryId: IdParamSchema,
});

export const CreateCategorySchema = z.strictObject({
  name: z.string().trim().min(1).max(CATEGORY_NAME_MAX_LENGTH),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const ListCategoriesQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(CATEGORY_SORT_FIELDS).default('NAME'),
  name: ContainsQuerySchema,
});

export const CategoryResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    // WAITING: typed in by the signed-in member with a submission, seen only by them until an admin approves it.
    status: z.enum(SUBMISSION_STATUSES),
    funkoCount: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Category' });

export const CategoryListResponseSchema = paginatedResponseSchema(CategoryResponseSchema);

export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof ListCategoriesQuerySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
