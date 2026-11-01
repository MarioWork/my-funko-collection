import { object, type InferType } from 'yup';
import {
  funkoBarcodeSchema,
  funkoCategoryIdSchema,
  funkoSeriesIdSchema,
  funkoExclusiveSchema,
  funkoIsChaseSchema,
  funkoNameSchema,
  funkoNumberSchema,
  funkoRemovalReasonSchema,
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

// Why the funko goes, when other users have it: sent to each of them.
export const RemoveFunkoSchema = object({
  reason: funkoRemovalReasonSchema,
});

export type RemoveFunko = InferType<typeof RemoveFunkoSchema>;

export type DeleteFunkoOptions = {
  // Removes the funko from every collection first; without it a funko in a collection answers 409.
  force?: boolean;
  // Needed with `force` when other users have it (the API answers 400 without); goes in the body.
  reason?: RemoveFunko['reason'];
};
