import { boolean, object, string, type InferType } from 'yup';
import type { CollectionApiModel } from '@app-types/models';
import type { CreateCollection } from '@services/collectionService/collectionService.type';
import { collectionNameSchema, collectionNotesSchema } from '@utils/collectionUtils';

export const collectionFormSchema = object({
  name: collectionNameSchema,
  notes: collectionNotesSchema,
  isDefault: boolean().required(),
});

export type CollectionFormValues = InferType<typeof collectionFormSchema>;

export const getInitialCollectionValues = (collection: CollectionApiModel | null): CollectionFormValues => ({
  name: collection?.name ?? '',
  notes: collection?.notes ?? '',
  isDefault: collection?.isDefault ?? false,
});

export const toCollectionPayload = (values: CollectionFormValues): CreateCollection => ({
  name: values.name,
  notes: values.notes ? values.notes : null,
  isDefault: values.isDefault,
});

export const notesSchema = string();
