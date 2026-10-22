import { env } from '../../../config/env.ts';
import type { FunkoImage } from '../../../db/schema/funkoImages.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import {
  UnsupportedImageError,
  hashImage,
  processImage,
  readLargeVariant,
  removeImageFiles,
  rotateBuffer,
  variantUrl,
} from '../../../lib/imageStorage.ts';
import { logger } from '../../../lib/logger.ts';
import { fetchRemoteFile } from '../../../lib/remoteFetch.ts';
import { assertFunkoExists } from '../funkoLookup.service.ts';
import { funkoImagesRepository } from './funkoImages.repository.ts';
import type { FunkoImageResponse, ReorderImages, RotateImage } from './funkoImages.schema.ts';

const ENTITY = 'Image';

const log = logger.child({ module: 'funkoImages' });

export function toImageResponse(row: FunkoImage): FunkoImageResponse {
  return {
    id: row.id,
    url: variantUrl(row.funkoId, row.fileKey, 'large'),
    mediumUrl: variantUrl(row.funkoId, row.fileKey, 'medium'),
    smallUrl: variantUrl(row.funkoId, row.fileKey, 'small'),
    placeholder: row.placeholder,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertRoomFor(funkoId: number, incoming: number): Promise<void> {
  const existing = await funkoImagesRepository.countByFunko(funkoId);
  const wouldExceed = existing + incoming > env.MAX_IMAGES_PER_FUNKO;

  if (wouldExceed) throw new BadRequestError(`A funko holds at most ${env.MAX_IMAGES_PER_FUNKO} images`);
}

async function assertNotDuplicate(funkoId: number, contentHash: string): Promise<void> {
  const existing = await funkoImagesRepository.findIdByHash(funkoId, contentHash);

  if (existing) throw new ConflictError('This image is already on the funko', existing.id);
}

async function storeOne(funkoId: number, buffer: Buffer): Promise<FunkoImage> {
  await assertNotDuplicate(funkoId, hashImage(buffer));

  let stored;

  try {
    stored = await processImage(funkoId, buffer);
  } catch (error: unknown) {
    if (error instanceof UnsupportedImageError) throw new BadRequestError(error.message, { cause: error });

    throw error;
  }

  const position = await funkoImagesRepository.nextPosition(funkoId);
  const row = await funkoImagesRepository.create({ funkoId, position, ...stored });

  log.info({ funkoId, imageId: row.id, sizeBytes: row.sizeBytes }, 'image stored');

  return row;
}

export async function getImages(funkoId: number): Promise<FunkoImageResponse[]> {
  const rows = await funkoImagesRepository.listByFunko(funkoId);

  return rows.map(toImageResponse);
}

// Files are processed one at a time on purpose: it bounds memory and CPU on the home server.
export async function addImages(funkoId: number, buffers: Buffer[]): Promise<FunkoImageResponse[]> {
  if (buffers.length === 0) throw new BadRequestError('Send at least one file in the "file" field');

  await assertFunkoExists(funkoId);
  await assertRoomFor(funkoId, buffers.length);

  const seenHashes = new Set<string>();
  const stored: FunkoImage[] = [];

  for (const buffer of buffers) {
    const contentHash = hashImage(buffer);

    if (seenHashes.has(contentHash)) throw new ConflictError('The same image was sent twice in one request');

    seenHashes.add(contentHash);
    stored.push(await storeOne(funkoId, buffer));
  }

  return stored.map(toImageResponse);
}

export async function addImageFromUrl(funkoId: number, url: string): Promise<FunkoImageResponse> {
  await assertFunkoExists(funkoId);
  await assertRoomFor(funkoId, 1);

  const buffer = await fetchRemoteFile(url, env.MAX_IMAGE_BYTES);
  const row = await storeOne(funkoId, buffer);

  return toImageResponse(row);
}

// The body must list every image of the funko exactly once; the first becomes the primary.
export async function reorderImages(funkoId: number, { imageIds }: ReorderImages): Promise<FunkoImageResponse[]> {
  await assertFunkoExists(funkoId);

  const current = await funkoImagesRepository.listByFunko(funkoId);
  const currentIds = new Set(current.map((image) => image.id));
  const requestedIds = new Set(imageIds);
  const isSameSet = currentIds.size === requestedIds.size && [...currentIds].every((id) => requestedIds.has(id));
  const hasDuplicates = requestedIds.size !== imageIds.length;

  if (!isSameSet || hasDuplicates) {
    throw new BadRequestError('imageIds must list every image of this funko exactly once');
  }

  await funkoImagesRepository.setPositions(funkoId, imageIds);

  return getImages(funkoId);
}

// Rotating writes fresh files under a new key: variant URLs are cached forever, so a changed image needs a new URL.
export async function rotateImage(
  funkoId: number,
  imageId: number,
  { degrees }: RotateImage,
): Promise<FunkoImageResponse> {
  const image = await funkoImagesRepository.findById(funkoId, imageId);

  if (!image) throw new NotFoundError(ENTITY, imageId);

  const rotated = await rotateBuffer(await readLargeVariant(funkoId, image.fileKey), degrees);
  const stored = await processImage(funkoId, rotated);
  const updated = await funkoImagesRepository.replaceFile(imageId, stored);

  if (!updated) throw new NotFoundError(ENTITY, imageId);

  await removeImageFiles(funkoId, image.fileKey);

  return toImageResponse(updated);
}

// Row first (the API stops serving it), files second (best effort).
export async function deleteImage(funkoId: number, imageId: number): Promise<void> {
  const deleted = await funkoImagesRepository.delete(funkoId, imageId);

  if (!deleted) throw new NotFoundError(ENTITY, imageId);

  await removeImageFiles(funkoId, deleted.fileKey);
}
