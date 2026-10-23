import { array, number, object } from 'yup';
import type { CollectionId, FunkoApiModel } from '@app-types/models';
import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';

export const AddStepUtil = {
  SCAN: 'scan',
  FOUND: 'found',
  FORM: 'form',
  SAVED: 'saved',
} as const;
export type AddStepUtil = (typeof AddStepUtil)[keyof typeof AddStepUtil];

export const AddIntentUtil = {
  CREATE: 'create',
  INCREMENT: 'increment',
} as const;
export type AddIntentUtil = (typeof AddIntentUtil)[keyof typeof AddIntentUtil];

export const ScanResultKindUtil = {
  FOUND: 'found',
  NOT_FOUND: 'not-found',
} as const;
export type ScanResultKindUtil = (typeof ScanResultKindUtil)[keyof typeof ScanResultKindUtil];

export type ScanResult =
  | { kind: typeof ScanResultKindUtil.FOUND; barcode: string; funko: FunkoApiModel }
  | { kind: typeof ScanResultKindUtil.NOT_FOUND; barcode: string };

// What the saved card shows: the funko as it is now (photos, lists).
export type AddResult = {
  funko: FunkoApiModel;
};

const idListSchema = array().of(number().integer().positive().required()).required();

// One copy going into one collection on Save: which collection, and what you know about that copy.
export type AddItem = Omit<CreateCollectionItem, 'funkoId'> & { collectionId: CollectionId };

export const collectionIdSchema = number().integer().positive().required();

export const incrementSchema = object({
  funkoId: number().integer().positive().required(),
  collectionIds: idListSchema.min(1),
  tagIds: idListSchema,
});
