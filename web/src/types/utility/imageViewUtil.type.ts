// The Images page: one row per funko with its images inside (the default), or every image as its own row.
export const ImageViewUtil = {
  IMAGES: 'images',
  FUNKOS: 'funkos',
} as const;

export type ImageViewUtil = (typeof ImageViewUtil)[keyof typeof ImageViewUtil];
