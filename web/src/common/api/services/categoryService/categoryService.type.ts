import { object, type InferType } from 'yup';
import { categoryNameSchema } from '@utils/categoryUtils';

export const CreateCategorySchema = object({
  name: categoryNameSchema,
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategory = InferType<typeof CreateCategorySchema>;
export type UpdateCategory = InferType<typeof UpdateCategorySchema>;
