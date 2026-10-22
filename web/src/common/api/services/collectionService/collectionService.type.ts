import { object, type InferType } from 'yup';
import { collectionIsDefaultSchema, collectionNameSchema, collectionNotesSchema } from '@utils/collectionUtils';

export const CreateCollectionSchema = object({
  name: collectionNameSchema,
  notes: collectionNotesSchema,
  isDefault: collectionIsDefaultSchema,
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export type CreateCollection = InferType<typeof CreateCollectionSchema>;
export type UpdateCollection = InferType<typeof UpdateCollectionSchema>;
