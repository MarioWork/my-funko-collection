// Shrinks a phone photo in the browser before upload: one decode + resize step via createImageBitmap (which also
// applies the EXIF orientation), drawn once into an OffscreenCanvas. iOS caps a canvas near 16.7 MP, so a 48 MP
// frame is resized during decode, never drawn at full size.
export const UPLOAD_LONG_EDGE_PX = 2000;
export const UPLOAD_JPEG_QUALITY = 0.85;
const JPEG_TYPE = 'image/jpeg';
const JPEG_EXTENSION = '.jpg';
const RELEASE_SIZE_PX = 1;
const FILE_EXTENSION_PATTERN = /\.[^.]+$/;

type ImageDimensions = {
  width: number;
  height: number;
};

function hasResizeSupport(): boolean {
  return typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function';
}

async function readDimensions(file: File): Promise<ImageDimensions> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const dimensions = { width: bitmap.width, height: bitmap.height };

  bitmap.close();

  return dimensions;
}

function targetSize(width: number, height: number): ImageDimensions {
  const longEdge = Math.max(width, height);

  if (longEdge <= UPLOAD_LONG_EDGE_PX) return { width, height };

  const scale = UPLOAD_LONG_EDGE_PX / longEdge;

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function jpegName(name: string): string {
  return name.replace(FILE_EXTENSION_PATTERN, '') + JPEG_EXTENSION;
}

// Returns the original file untouched when the browser cannot resize or the photo is already small enough.
export async function resizeImageFile(file: File): Promise<File> {
  if (!hasResizeSupport()) return file;

  try {
    const { width, height } = await readDimensions(file);
    const target = targetSize(width, height);
    const isSmallEnough = target.width === width && target.height === height && file.type === JPEG_TYPE;

    if (isSmallEnough) return file;

    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
      resizeWidth: target.width,
      resizeHeight: target.height,
      resizeQuality: 'high',
    });
    const canvas = new OffscreenCanvas(target.width, target.height);
    const context = canvas.getContext('2d');

    if (!context) return file;

    context.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: JPEG_TYPE, quality: UPLOAD_JPEG_QUALITY });

    // Give the memory back right away; Safari keeps canvas backing stores around otherwise.
    canvas.width = RELEASE_SIZE_PX;
    canvas.height = RELEASE_SIZE_PX;

    return new File([blob], jpegName(file.name), { type: JPEG_TYPE, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

export async function resizeImageFiles(files: File[]): Promise<File[]> {
  const resized: File[] = [];

  // One at a time on purpose: two 48 MP decodes in flight can kill the tab on a phone.
  for (const file of files) resized.push(await resizeImageFile(file));

  return resized;
}
