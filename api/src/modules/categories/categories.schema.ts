import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { CATEGORY_SORT_FIELDS, categories } from '../../db/schema/categories.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { ContainsQuerySchema } from '../../lib/queryParams.ts';

export const CATEGORY_NAME_MAX_LENGTH = 100;

export const CategoryParamsSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

const CategoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.trim().min(1).max(CATEGORY_NAME_MAX_LENGTH),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const CreateCategorySchema = z.strictObject(CategoryInsertSchema.shape);

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const ListCategoriesQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(CATEGORY_SORT_FIELDS).default('NAME'),
  name: ContainsQuerySchema,
});

export const CategoryResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
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
