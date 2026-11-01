import { env } from '../../../config/env.ts';
import { BadRequestError, ConflictError, NotFoundError } from '../../../lib/httpErrors.ts';
import {
  hashImage,
  processImage,
  readLargeFile,
  removeImageFiles,
  rotateBuffer,
  sizeUrl,
} from '../../../lib/imageStorage.ts';
import { logger } from '../../../lib/logger.ts';
import { fetchRemoteFile } from '../../../lib/remoteFetch.ts';
import type { SignedInUser } from '../../auth/auth.type.ts';
import { assertCanEditFunko, canSeeFunko } from '../funkos.access.ts';
import { funkoImagesRepository, type FunkoImageRow } from './funkoImages.repository.ts';
import type { ReorderImages, RotateImage } from './funkoImages.schema.ts';
import type { FunkoImageResponse } from './funkoImages.type.ts';

const ENTITY = 'Image';
const FILE_ENTITY = 'Image file';

const log = logger.child({ module: 'funkoImages' });

export function toImageResponse(row: FunkoImageRow): FunkoImageResponse {
  return {
    id: row.id,
    url: sizeUrl(row.funkoId, row.fileKey, 'large'),
    mediumUrl: sizeUrl(row.funkoId, row.fileKey, 'medium'),
    smallUrl: sizeUrl(row.funkoId, row.fileKey, 'small'),
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

// The funko must be one `user` may change: any for an admin, their own waiting submission for a member. 404 when
// they cannot see it, 403 ADMIN_ONLY when they see it but may not change it.
async function assertCanEditImagesOf(user: SignedInUser, funkoId: number): Promise<void> {
  assertCanEditFunko(user, funkoId, await funkoImagesRepository.findFunkoAccess(funkoId));
}

// For the image files under /uploads: a funko's photos are seen by whoever may open the funko. Once approved that is
// everyone signed in; a waiting, rejected or merged submission's only by admins and its sender (whoever uploaded
// each photo), so an orphaned one (its sender deleted) by admins only. A file outside any funko the user may open
// (no such funko, a loose file) answers 404 to a member; an admin sees every file, as the Images page lists them.
export async function assertCanSeeImageFiles(user: SignedInUser, funkoId: number | undefined): Promise<void> {
  if (user.isAdmin) return;

  const funko = funkoId === undefined ? undefined : await funkoImagesRepository.findFunkoAccess(funkoId);
  const isVisible = funko !== undefined && canSeeFunko(user, funko);

  if (!isVisible) throw new NotFoundError(FILE_ENTITY, funkoId ?? 'unknown');
}

// `userId` is the signed-in user: every image records who uploaded it.
async function storeOne(userId: number, funkoId: number, buffer: Buffer): Promise<FunkoImageRow> {
  await assertNotDuplicate(funkoId, hashImage(buffer));

  // Bytes that are not an image are refused here with a 400 (imageStorage throws BadRequestError).
  const stored = await processImage(funkoId, buffer);
  const position = await funkoImagesRepository.nextPosition(funkoId);
  const row = await funkoImagesRepository.create({ funkoId, uploadedById: userId, position, ...stored });

  log.info({ funkoId, imageId: row.id, sizeBytes: row.sizeBytes }, 'image stored');

  return row;
}

export async function getImages(funkoId: number): Promise<FunkoImageResponse[]> {
  const rows = await funkoImagesRepository.listByFunko(funkoId);

  return rows.map(toImageResponse);
}

// Files are processed one at a time on purpose: it bounds memory and CPU on the home server.
export async function addImages(user: SignedInUser, funkoId: number, buffers: Buffer[]): Promise<FunkoImageResponse[]> {
  if (buffers.length === 0) throw new BadRequestError('Send at least one file in the "file" field');

  await assertCanEditImagesOf(user, funkoId);
  await assertRoomFor(funkoId, buffers.length);

  const seenHashes = new Set<string>();
  const stored: FunkoImageRow[] = [];

  for (const buffer of buffers) {
    const contentHash = hashImage(buffer);

    if (seenHashes.has(contentHash)) throw new ConflictError('The same image was sent twice in one request');

    seenHashes.add(contentHash);
    stored.push(await storeOne(user.userId, funkoId, buffer));
  }

  return stored.map(toImageResponse);
}

export async function addImageFromUrl(user: SignedInUser, funkoId: number, url: string): Promise<FunkoImageResponse> {
  await assertCanEditImagesOf(user, funkoId);
  await assertRoomFor(funkoId, 1);

  const buffer = await fetchRemoteFile(url, env.MAX_IMAGE_BYTES);
  const row = await storeOne(user.userId, funkoId, buffer);

  return toImageResponse(row);
}

// The body must list every image of the funko exactly once; the first becomes the primary.
export async function reorderImages(
  user: SignedInUser,
  funkoId: number,
  { imageIds }: ReorderImages,
): Promise<FunkoImageResponse[]> {
  await assertCanEditImagesOf(user, funkoId);

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

// Rotating writes fresh files under a new key: size URLs are cached forever, so a changed image needs a new URL.
export async function rotateImage(
  user: SignedInUser,
  funkoId: number,
  imageId: number,
  { degrees }: RotateImage,
): Promise<FunkoImageResponse> {
  await assertCanEditImagesOf(user, funkoId);

  const image = await funkoImagesRepository.findById(funkoId, imageId);

  if (!image) throw new NotFoundError(ENTITY, imageId);

  const rotated = await rotateBuffer(await readLargeFile(funkoId, image.fileKey), degrees);
  const stored = await processImage(funkoId, rotated);
  const updated = await funkoImagesRepository.replaceFile(imageId, stored);

  if (!updated) throw new NotFoundError(ENTITY, imageId);

  await removeImageFiles(funkoId, image.fileKey);

  return toImageResponse(updated);
}

// Row first (the API stops serving it), files second (best effort).
export async function deleteImage(user: SignedInUser, funkoId: number, imageId: number): Promise<void> {
  await assertCanEditImagesOf(user, funkoId);

  const deleted = await funkoImagesRepository.delete(funkoId, imageId);

  if (!deleted) throw new NotFoundError(ENTITY, imageId);

  await removeImageFiles(funkoId, deleted.fileKey);
}
