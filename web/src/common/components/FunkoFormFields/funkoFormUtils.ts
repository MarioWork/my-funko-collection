import { boolean, object, string, type InferType } from 'yup';
import type { CategoryApiModel, FunkoApiModel } from '@app-types/models';
import { FunkoTypeUtil, SubmissionStatusUtil } from '@app-types/utility';
import type { CreateFunko } from '@services/funkoService/funkoService.type';
import {
  FUNKO_CATEGORY_REQUIRED_MESSAGE,
  funkoBarcodeSchema,
  funkoExclusiveSchema,
  funkoNameSchema,
  funkoNumberSchema,
  funkoTypeSchema,
} from '@utils/funkoUtils';

// A category or series the member typed in with a submission says so in the dropdown: nobody else sees it yet.
export function referenceOptionLabel({ name, status }: Pick<CategoryApiModel, 'name' | 'status'>): string {
  return status === SubmissionStatusUtil.WAITING ? `${name} (waiting for review)` : name;
}

// Form values are strings as inputs produce them; `toPayload` turns them into the service's shape.
export const funkoFormSchema = object({
  name: funkoNameSchema,
  number: funkoNumberSchema,
  type: funkoTypeSchema,
  categoryId: string().required(FUNKO_CATEGORY_REQUIRED_MESSAGE),
  // '' = no series.
  seriesId: string().defined(),
  isChase: boolean().required(),
  exclusive: funkoExclusiveSchema,
  barcode: funkoBarcodeSchema,
});

export type FunkoFormValues = InferType<typeof funkoFormSchema>;

export const getInitialFunkoValues = (overrides: Partial<FunkoFormValues> = {}): FunkoFormValues => ({
  name: '',
  number: '',
  type: FunkoTypeUtil.POP,
  categoryId: '',
  seriesId: '',
  isChase: false,
  exclusive: '',
  barcode: '',
  ...overrides,
});

export const funkoToFormValues = (funko: FunkoApiModel): FunkoFormValues => ({
  name: funko.name,
  number: funko.number,
  type: funko.type,
  categoryId: String(funko.category.id),
  seriesId: funko.series ? String(funko.series.id) : '',
  isChase: funko.isChase,
  exclusive: funko.exclusive,
  barcode: funko.barcode ?? '',
});

export const toFunkoPayload = (values: FunkoFormValues): CreateFunko => ({
  name: values.name,
  number: values.number,
  type: values.type,
  categoryId: Number(values.categoryId),
  seriesId: values.seriesId ? Number(values.seriesId) : null,
  isChase: values.isChase,
  exclusive: values.exclusive,
  barcode: values.barcode ? values.barcode : null,
});
