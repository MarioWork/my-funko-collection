// The only file that touches sharp and the uploads folder. Services hand it bytes and get back file metadata.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readdir, readFile, rename, rm, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.ts';
import { logger } from './logger.ts';

const log = logger.child({ module: 'imageStorage' });

export const FUNKOS_UPLOAD_FOLDER = 'funkos';
export const UPLOADS_URL_PREFIX = '/uploads';

const LARGE_QUALITY = 82;
const MEDIUM_QUALITY = 80;
const SMALL_QUALITY = 80;
const PLACEHOLDER_PX = 24;
const PLACEHOLDER_QUALITY = 30;
const TMP_SUFFIX = '.tmp';
// Two encoder threads and a 50 MB decode cache: enough for one user, never the whole server.
const SHARP_CONCURRENCY = 2;
const SHARP_CACHE_MB = 50;

export const IMAGE_VARIANTS = ['large', 'medium', 'small'] as const;
export type ImageVariant = (typeof IMAGE_VARIANTS)[number];

type VariantSpec = { suffix: string; maxPx: number; quality: number };

const VARIANT_SPECS: Record<ImageVariant, VariantSpec> = {
  large: { suffix: '.webp', maxPx: env.IMAGE_LARGE_PX, quality: LARGE_QUALITY },
  medium: { suffix: '.md.webp', maxPx: env.IMAGE_MEDIUM_PX, quality: MEDIUM_QUALITY },
  small: { suffix: '.sm.webp', maxPx: env.IMAGE_SMALL_PX, quality: SMALL_QUALITY },
};

export type StoredImage = {
  fileKey: string;
  width: number;
  height: number;
  sizeBytes: number;
  contentHash: string;
  placeholder: string;
};

// Thrown when the bytes are not an image sharp can decode; the service turns it into a 400.
export class UnsupportedImageError extends Error {
  constructor(cause: unknown) {
    super('Not a supported image', { cause });
    this.name = 'UnsupportedImageError';
  }
}

export function hashImage(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function funkoFolder(funkoId: number): string {
  return join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER, String(funkoId));
}

export function variantFileName(fileKey: string, variant: ImageVariant): string {
  return `${fileKey}${VARIANT_SPECS[variant].suffix}`;
}

export function variantUrl(funkoId: number, fileKey: string, variant: ImageVariant): string {
  return `${UPLOADS_URL_PREFIX}/${FUNKOS_UPLOAD_FOLDER}/${funkoId}/${variantFileName(fileKey, variant)}`;
}

// Called once by the uploads plugin: caps sharp's threads and cache, and creates the folder.
export async function initImageStorage(): Promise<void> {
  sharp.concurrency(SHARP_CONCURRENCY);
  sharp.cache({ memory: SHARP_CACHE_MB });
  await mkdir(join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER), { recursive: true });
}

// Write-then-rename so a crash never leaves a half-written file under its final name.
async function writeAtomically(finalPath: string, data: Buffer): Promise<void> {
  const tmpPath = `${finalPath}${TMP_SUFFIX}`;
  const handle = await open(tmpPath, 'w');

  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }

  await rename(tmpPath, finalPath);
}

async function decode(buffer: Buffer): Promise<sharp.Sharp> {
  // `rotate()` with no argument applies the EXIF orientation; output drops all metadata unless asked otherwise.
  const pipeline = sharp(buffer, { failOn: 'error' }).rotate();

  try {
    await pipeline.metadata();
  } catch (error: unknown) {
    throw new UnsupportedImageError(error);
  }

  return pipeline;
}

async function renderVariant(pipeline: sharp.Sharp, spec: VariantSpec) {
  return pipeline
    .clone()
    .resize({ width: spec.maxPx, height: spec.maxPx, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: spec.quality })
    .toBuffer({ resolveWithObject: true });
}

async function renderPlaceholder(pipeline: sharp.Sharp): Promise<string> {
  const buffer = await pipeline
    .clone()
    .resize({ width: PLACEHOLDER_PX, height: PLACEHOLDER_PX, fit: 'inside' })
    .webp({ quality: PLACEHOLDER_QUALITY })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

// One decode, three WebP files plus the placeholder, written under a fresh uuid key. Cleans up after itself on failure.
export async function processImage(funkoId: number, buffer: Buffer): Promise<StoredImage> {
  const pipeline = await decode(buffer);
  const fileKey = randomUUID();
  const folder = funkoFolder(funkoId);
  const writtenPaths: string[] = [];

  await mkdir(folder, { recursive: true });

  try {
    const [large, medium, small] = await Promise.all([
      renderVariant(pipeline, VARIANT_SPECS.large),
      renderVariant(pipeline, VARIANT_SPECS.medium),
      renderVariant(pipeline, VARIANT_SPECS.small),
    ]);
    const placeholder = await renderPlaceholder(pipeline);
    const outputs: [ImageVariant, Buffer][] = [
      ['large', large.data],
      ['medium', medium.data],
      ['small', small.data],
    ];

    for (const [variant, data] of outputs) {
      const path = join(folder, variantFileName(fileKey, variant));

      await writeAtomically(path, data);
      writtenPaths.push(path);
    }

    return {
      fileKey,
      width: large.info.width,
      height: large.info.height,
      sizeBytes: large.info.size + medium.info.size + small.info.size,
      contentHash: hashImage(buffer),
      placeholder,
    };
  } catch (error: unknown) {
    await Promise.all(writtenPaths.map((path) => unlink(path).catch(() => undefined)));
    throw error;
  }
}

// Reads the stored large variant back as bytes, for a rotate that regenerates every variant.
export async function readLargeVariant(funkoId: number, fileKey: string): Promise<Buffer> {
  return readFile(join(funkoFolder(funkoId), variantFileName(fileKey, 'large')));
}

export async function rotateBuffer(buffer: Buffer, degrees: number): Promise<Buffer> {
  return sharp(buffer).rotate(degrees).toBuffer();
}

// Best effort: a missing file is not an error worth failing the request for, but it is worth a line in the log.
export async function removeImageFiles(funkoId: number, fileKey: string): Promise<void> {
  const folder = funkoFolder(funkoId);

  for (const variant of IMAGE_VARIANTS) {
    try {
      await unlink(join(folder, variantFileName(fileKey, variant)));
    } catch (error: unknown) {
      log.warn({ err: error, funkoId, fileKey, variant }, 'could not remove image file');
    }
  }
}

export async function removeFunkoFolder(funkoId: number): Promise<void> {
  try {
    await rm(funkoFolder(funkoId), { recursive: true, force: true });
  } catch (error: unknown) {
    log.warn({ err: error, funkoId }, 'could not remove funko image folder');
  }
}

// Every image's files as they sit on disk, grouped by file key: what the Images page lists, rows or not.
export type StoredImageFiles = {
  // The folder under funkos/: the funko id the files were saved for.
  folder: string;
  fileKey: string;
  variants: ImageVariant[];
  // Sum of the files present.
  sizeBytes: number;
  // The newest of the files' modification times: when it was saved.
  modifiedAt: Date;
};

export type ImageDimensions = {
  width: number;
  height: number;
};

const SUFFIX_VARIANTS = IMAGE_VARIANTS.map((variant) => ({ variant, suffix: VARIANT_SPECS[variant].suffix }))
  // Longest suffix first, so ".md.webp" is not taken for ".webp".
  .sort((first, second) => second.suffix.length - first.suffix.length);

function parseVariantFile(fileName: string): { fileKey: string; variant: ImageVariant } | null {
  const match = SUFFIX_VARIANTS.find(({ suffix }) => fileName.endsWith(suffix));

  if (!match) return null;

  return { fileKey: fileName.slice(0, -match.suffix.length), variant: match.variant };
}

async function listFolderImages(folder: string): Promise<StoredImageFiles[]> {
  const folderPath = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER, folder);
  const byKey = new Map<string, StoredImageFiles>();

  for (const fileName of await readdir(folderPath)) {
    const parsed = parseVariantFile(fileName);

    if (!parsed) continue;

    const fileStat = await stat(join(folderPath, fileName));
    const entry = byKey.get(parsed.fileKey) ?? {
      folder,
      fileKey: parsed.fileKey,
      variants: [],
      sizeBytes: 0,
      modifiedAt: fileStat.mtime,
    };

    entry.variants.push(parsed.variant);
    entry.sizeBytes += fileStat.size;
    if (fileStat.mtime > entry.modifiedAt) entry.modifiedAt = fileStat.mtime;
    byKey.set(parsed.fileKey, entry);
  }

  return [...byKey.values()];
}

export async function listStoredImageFiles(): Promise<StoredImageFiles[]> {
  const root = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const perFolder = await Promise.all(folders.map(listFolderImages));

  return perFolder.flat();
}

export function storedFileUrl(folder: string, fileKey: string, variant: ImageVariant): string {
  return `${UPLOADS_URL_PREFIX}/${FUNKOS_UPLOAD_FOLDER}/${folder}/${variantFileName(fileKey, variant)}`;
}

// Width and height of one stored file; null when it cannot be read.
export async function readImageDimensions(
  folder: string,
  fileKey: string,
  variant: ImageVariant,
): Promise<ImageDimensions | null> {
  try {
    const path = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER, folder, variantFileName(fileKey, variant));
    const { width, height } = await sharp(path).metadata();

    return width && height ? { width, height } : null;
  } catch (error: unknown) {
    log.warn({ err: error, folder, fileKey, variant }, 'could not read image dimensions');

    return null;
  }
}
