import { object, type InferType } from 'yup';
import {
  funkoBarcodeSchema,
  funkoCategoryIdSchema,
  funkoSeriesIdSchema,
  funkoExclusiveSchema,
  funkoIsChaseSchema,
  funkoNameSchema,
  funkoNumberSchema,
  funkoTypeSchema,
} from '@utils/funkoUtils';

export const CreateFunkoSchema = object({
  name: funkoNameSchema,
  number: funkoNumberSchema,
  type: funkoTypeSchema,
  categoryId: funkoCategoryIdSchema,
  seriesId: funkoSeriesIdSchema,
  isChase: funkoIsChaseSchema,
  exclusive: funkoExclusiveSchema,
  barcode: funkoBarcodeSchema,
});

export const UpdateFunkoSchema = CreateFunkoSchema.partial();

export type CreateFunko = InferType<typeof CreateFunkoSchema>;
export type UpdateFunko = InferType<typeof UpdateFunkoSchema>;

export type DeleteFunkoOptions = {
  // Removes the funko from every collection first; without it a funko in a collection answers 409.
  force?: boolean;
};
