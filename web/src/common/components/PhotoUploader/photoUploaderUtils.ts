import { resizeImageFiles } from '@utils/imageResizeUtils';

// image/jpeg first: Safari transcodes HEIC to the first listed type. No `capture` on this input, so iOS offers
// Take Photo / Photo Library; the camera-only input is separate and single-file.
export const LIBRARY_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PHOTO_FIELD = 'file';
export const MAX_PHOTOS_PER_BATCH = 10;

export type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

export function toPendingPhotos(files: File[]): PendingPhoto[] {
  return files.map((file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) }));
}

export function releasePreviews(photos: PendingPhoto[]): void {
  for (const photo of photos) URL.revokeObjectURL(photo.previewUrl);
}

export async function prepareUpload(photos: PendingPhoto[]): Promise<FormData> {
  const resized = await resizeImageFiles(photos.map((photo) => photo.file));
  const body = new FormData();

  for (const file of resized) body.append(PHOTO_FIELD, file, file.name);

  return body;
}
