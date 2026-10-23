// Saving an image as a JPEG. The server keeps WebP only (small and sharp), but a saved file should open
// anywhere: in old photo apps, in Windows' viewer, as an email attachment. So the browser redraws it as a JPEG first.

const JPEG_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.92;
// JPEG has no transparency; anything see-through lands on white rather than black.
const BACKGROUND_COLOR = 'white';

async function toJpegBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);

  if (!response.ok) throw new Error('The image could not be loaded');

  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext('2d');

  if (!context) throw new Error('This browser cannot convert images');

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be converted'))),
      JPEG_TYPE,
      JPEG_QUALITY,
    );
  });
}

function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadImageAsJpeg(imageUrl: string, fileName: string): Promise<void> {
  const blob = await toJpegBlob(imageUrl);

  saveBlob(blob, fileName);
}
