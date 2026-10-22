import { number, object, string, type InferType } from 'yup';
import type { FunkoApiModel } from '@app-types/models';
import { FunkoTypeUtil } from '@app-types/utility';
import type { CreateFunko } from '@services/funkoService/funkoService.type';
import { funkoBarcodeSchema, funkoNameSchema, funkoNumberSchema, funkoTypeSchema } from '@utils/funkoUtils';
import { itemQuantitySchema } from '@utils/itemUtils';

export const AddStepUtil = {
  SCAN: 'scan',
  FOUND: 'found',
  QUICK: 'quick',
  DETAILS: 'details',
  ADDED: 'added',
} as const;
export type AddStepUtil = (typeof AddStepUtil)[keyof typeof AddStepUtil];

export const AddIntentUtil = {
  CREATE: 'create',
  INCREMENT: 'increment',
} as const;
export type AddIntentUtil = (typeof AddIntentUtil)[keyof typeof AddIntentUtil];

export type ScanResult =
  { kind: 'found'; barcode: string; funko: FunkoApiModel } | { kind: 'not-found'; barcode: string };

// The quick card after a scan: the few things a box tells you, plus how many you hold.
export const quickAddSchema = object({
  name: funkoNameSchema,
  number: funkoNumberSchema,
  type: funkoTypeSchema,
  categoryId: string().required('Category is required'),
  quantity: itemQuantitySchema,
  barcode: funkoBarcodeSchema,
});

export type QuickAddValues = InferType<typeof quickAddSchema>;

export const getQuickAddValues = (overrides: Partial<QuickAddValues> = {}): QuickAddValues => ({
  name: '',
  number: '',
  type: FunkoTypeUtil.POP,
  categoryId: '',
  quantity: 1,
  barcode: '',
  ...overrides,
});

export const toQuickFunkoPayload = (values: QuickAddValues): CreateFunko => ({
  name: values.name,
  number: values.number,
  type: values.type,
  categoryId: Number(values.categoryId),
  isChase: false,
  exclusive: '',
  barcode: values.barcode ? values.barcode : null,
});

export const incrementSchema = object({
  funkoId: number().integer().positive().required(),
  collectionId: number().integer().positive().required(),
});
