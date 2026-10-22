import { object, type InferType } from 'yup';
import { tagNameSchema, tagNotesSchema } from '@utils/tagUtils';

export const CreateTagSchema = object({
  name: tagNameSchema,
  notes: tagNotesSchema,
});

export const UpdateTagSchema = CreateTagSchema.partial();

export type CreateTag = InferType<typeof CreateTagSchema>;
export type UpdateTag = InferType<typeof UpdateTagSchema>;
