import { IMAGE_FILE_FIELD } from '@services/funkoImageService/funkoImageService';
import { resizeImageFiles } from '@utils/imageResizeUtils';

// image/jpeg first: Safari transcodes HEIC to the first listed type. No `capture` on this input, so iOS offers
// Take Photo / Photo Library; the camera-only input is separate and single-file.
export const LIBRARY_ACCEPT = 'image/jpeg,image/png,image/webp';
// The camera always hands back a JPEG.
export const CAMERA_ACCEPT = 'image/jpeg';
// The multipart field the API reads every image from; one name, owned by the service.
export const PHOTO_FIELD = IMAGE_FILE_FIELD;
export const MAX_PHOTOS_PER_BATCH = 10;
// The most one image may weigh, picked or uploaded. Keep in step with the API's MAX_IMAGE_BYTES default.
export const MAX_PHOTO_MEGABYTES = 5;
const BYTES_PER_MEGABYTE = 1024 * 1024;
export const MAX_PHOTO_BYTES = MAX_PHOTO_MEGABYTES * BYTES_PER_MEGABYTE;

export function isTooLargePhoto(file: File): boolean {
  return file.size > MAX_PHOTO_BYTES;
}

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
