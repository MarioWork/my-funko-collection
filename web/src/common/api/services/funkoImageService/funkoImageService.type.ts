import { array, number, object, type InferType } from 'yup';

export const ROTATION_DEGREES = [90, 180, 270] as const;

export const ReorderImagesSchema = object({
  imageIds: array().of(number().integer().positive().required()).min(1).required(),
});

export const RotateImageSchema = object({
  degrees: number()
    .oneOf([...ROTATION_DEGREES])
    .required(),
});

export type ReorderImages = InferType<typeof ReorderImagesSchema>;
export type RotateImage = InferType<typeof RotateImageSchema>;
