import { array, number, object } from 'yup';
import type { FunkoApiModel } from '@app-types/models';

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

export type ScanResult =
  { kind: 'found'; barcode: string; funko: FunkoApiModel } | { kind: 'not-found'; barcode: string };

// What the saved card shows: the funko as it is now (photos, lists), plus any step that did not go through.
export type AddResult = {
  funko: FunkoApiModel;
  warnings: string[];
};

const idListSchema = array().of(number().integer().positive().required()).required();

export const destinationSchema = object({
  collectionIds: idListSchema,
  tagIds: idListSchema,
});

export const incrementSchema = object({
  funkoId: number().integer().positive().required(),
  collectionIds: idListSchema.min(1),
  tagIds: idListSchema,
});
