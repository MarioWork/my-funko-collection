import { array, number, object, string, type InferType } from 'yup';

export const ROTATION_DEGREES = [90, 180, 270] as const;

export const ImageFromUrlSchema = object({
  url: string().trim().url('Enter a full http(s) URL').required('URL is required'),
});

export const ReorderImagesSchema = object({
  imageIds: array().of(number().integer().positive().required()).min(1).required(),
});

export const RotateImageSchema = object({
  degrees: number()
    .oneOf([...ROTATION_DEGREES])
    .required(),
});

export type ImageFromUrl = InferType<typeof ImageFromUrlSchema>;
export type ReorderImages = InferType<typeof ReorderImagesSchema>;
export type RotateImage = InferType<typeof RotateImageSchema>;
