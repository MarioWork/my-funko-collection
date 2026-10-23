// The only file that touches sharp and the uploads folder. Services hand it bytes and get back file metadata.
import { createHash, randomUUID } from 'node:crypto';
import { access, copyFile, mkdir, open, readdir, readFile, rename, rm, stat, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.ts';
import { BadRequestError } from './httpErrors.ts';
import { logger } from './logger.ts';

const log = logger.child({ module: 'imageStorage' });

export const FUNKOS_UPLOAD_FOLDER = 'funkos';
export const UPLOADS_URL_PREFIX = '/uploads';
// The folder the uploads plugin serves under UPLOADS_URL_PREFIX.
export const UPLOADS_ROOT = resolve(env.UPLOADS_DIR);

const LARGE_QUALITY = 82;
const MEDIUM_QUALITY = 80;
const SMALL_QUALITY = 80;
const PLACEHOLDER_PX = 24;
const PLACEHOLDER_QUALITY = 30;
const TMP_SUFFIX = '.tmp';
// Two encoder threads and a 50 MB decode cache: enough for one user, never the whole server.
const SHARP_CONCURRENCY = 2;
const SHARP_CACHE_MB = 50;
const UNSUPPORTED_IMAGE_MESSAGE = 'Not a supported image';
const MISSING_FILE_CODE = 'ENOENT';

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

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === MISSING_FILE_CODE;
}

export function hashImage(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function funkoFolder(funkoId: number): string {
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
  forgetStoredFiles();
}

// Bytes sharp cannot decode are the caller's input error: a 400.
async function decode(buffer: Buffer): Promise<sharp.Sharp> {
  // `rotate()` with no argument applies the EXIF orientation; output drops all metadata unless asked otherwise.
  const pipeline = sharp(buffer, { failOn: 'error' }).rotate();

  try {
    await pipeline.metadata();
  } catch (error: unknown) {
    throw new BadRequestError(UNSUPPORTED_IMAGE_MESSAGE, { cause: error });
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

// Best effort, for cleaning up after a failed write: a file that cannot be removed is logged, not thrown.
async function removeQuietly(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error: unknown) {
    log.warn({ err: error, path }, 'could not remove a partly written image file');
  }
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
    await Promise.all(writtenPaths.map(removeQuietly));
    forgetStoredFiles();
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

  forgetStoredFiles();

  for (const variant of IMAGE_VARIANTS) {
    try {
      await unlink(join(folder, variantFileName(fileKey, variant)));
    } catch (error: unknown) {
      log.warn({ err: error, funkoId, fileKey, variant }, 'could not remove image file');
    }
  }
}

export async function removeFunkoFolder(funkoId: number): Promise<void> {
  forgetStoredFiles();

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

// The funko folders under funkos/; none yet when nothing was ever uploaded.
async function readFunkoFolderNames(): Promise<string[]> {
  const root = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER);

  try {
    const entries = await readdir(root, { withFileTypes: true });

    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error: unknown) {
    if (isMissingFile(error)) return [];

    throw error;
  }
}

async function readStoredImageFiles(): Promise<StoredImageFiles[]> {
  const folders = await readFunkoFolderNames();
  const perFolder = await Promise.all(folders.map(listFolderImages));

  return perFolder.flat();
}

// Listing every file is the slow part of the Images page, so the result is kept until this process writes or
// deletes an image (which forgets it at once), or for a minute, which covers changes made outside the server
// (`yarn images:prune`, a restored backup).
const STORED_FILES_TTL_MS = 60_000;
let storedFilesCache: { files: Promise<StoredImageFiles[]>; readAt: number } | null = null;

// Also for whoever empties the folder behind the server's back (the test reset).
export function forgetStoredFiles(): void {
  storedFilesCache = null;
}

// A failed read must not stick in the cache: the next call tries again.
async function readStoredImageFilesOrForget(): Promise<StoredImageFiles[]> {
  try {
    return await readStoredImageFiles();
  } catch (error: unknown) {
    forgetStoredFiles();
    throw error;
  }
}

export async function listStoredImageFiles(): Promise<StoredImageFiles[]> {
  const isFresh = storedFilesCache !== null && Date.now() - storedFilesCache.readAt < STORED_FILES_TTL_MS;

  if (!isFresh || !storedFilesCache) {
    storedFilesCache = { files: readStoredImageFilesOrForget(), readAt: Date.now() };
  }

  return storedFilesCache.files;
}

export function storedFileUrl(folder: string, fileKey: string, variant: ImageVariant): string {
  return `${UPLOADS_URL_PREFIX}/${FUNKOS_UPLOAD_FOLDER}/${folder}/${variantFileName(fileKey, variant)}`;
}

// Loose files' dimensions, which mean decoding the file's header: remembered by file and size, so a changed file is
// read again.
const dimensionsCache = new Map<string, ImageDimensions | null>();

// Width and height of one stored file; null when it cannot be read.
export async function readImageDimensions(
  folder: string,
  fileKey: string,
  variant: ImageVariant,
): Promise<ImageDimensions | null> {
  const path = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER, folder, variantFileName(fileKey, variant));

  try {
    const { size } = await stat(path);
    const cacheKey = `${path}:${size}`;

    if (dimensionsCache.has(cacheKey)) return dimensionsCache.get(cacheKey) ?? null;

    const { width, height } = await sharp(path).metadata();
    const dimensions = width && height ? { width, height } : null;

    dimensionsCache.set(cacheKey, dimensions);

    return dimensions;
  } catch (error: unknown) {
    log.warn({ err: error, folder, fileKey, variant }, 'could not read image dimensions');

    return null;
  }
}

// Empties the whole uploads folder: the dev seed and the test reset start from nothing.
export async function clearUploads(): Promise<void> {
  await rm(env.UPLOADS_DIR, { recursive: true, force: true });
  forgetStoredFiles();
}

// The `<funkoId>/<fileKey>` key of one stored image, the form `pruneOrphanFiles` takes.
export function storedFileKey(funkoId: number | string, fileKey: string): string {
  return `${funkoId}/${fileKey}`;
}

async function pruneFolder(folder: string, knownKeys: Set<string>): Promise<number> {
  const folderPath = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER, folder);
  let removed = 0;

  for (const fileName of await readdir(folderPath)) {
    // A file that is not a variant (a stray `.tmp`) has no key a row could hold, so it goes too.
    const fileKey = parseVariantFile(fileName)?.fileKey ?? fileName;
    const isKnown = knownKeys.has(storedFileKey(folder, fileKey));

    if (isKnown) continue;

    await rm(join(folderPath, fileName), { force: true });
    removed += 1;
  }

  const isEmptyNow = (await readdir(folderPath)).length === 0;

  if (isEmptyNow) await rm(folderPath, { recursive: true, force: true });

  return removed;
}

// Deletes every file no row points at (`knownKeys` holds `storedFileKey(funkoId, fileKey)` for each row) and the
// folders left empty. Returns how many files went.
export async function pruneOrphanFiles(knownKeys: Set<string>): Promise<number> {
  let removed = 0;

  for (const folder of await readFunkoFolderNames()) {
    removed += await pruneFolder(folder, knownKeys);
  }

  forgetStoredFiles();

  return removed;
}

export type GeneratedImageOptions = {
  width: number;
  height: number;
  // A CSS colour for a solid image; ignored when `noise` is set.
  background?: string;
  // Random pixels: an image that does not compress, for size-limit tests.
  noise?: boolean;
  format?: 'png' | 'jpeg';
  // An EXIF orientation tag to write, as a phone camera does.
  orientation?: number;
};

const DEFAULT_GENERATED_BACKGROUND = '#4466aa';
const RGB_CHANNELS = 3;
const BYTE_VALUES = 256;

function noisePixels(width: number, height: number): Buffer {
  const length = width * height * RGB_CHANNELS;

  return Buffer.from(Array.from({ length }, () => Math.floor(Math.random() * BYTE_VALUES)));
}

function generatedBase(options: GeneratedImageOptions): sharp.Sharp {
  const { width, height } = options;

  if (options.noise) return sharp(noisePixels(width, height), { raw: { width, height, channels: RGB_CHANNELS } });

  const background = options.background ?? DEFAULT_GENERATED_BACKGROUND;

  return sharp({ create: { width, height, channels: RGB_CHANNELS, background } });
}

// A generated picture for the dev seed and the tests, so neither needs sharp itself.
export async function generateImage(options: GeneratedImageOptions): Promise<Buffer> {
  const base = generatedBase(options);
  const withOrientation = options.orientation ? base.withMetadata({ orientation: options.orientation }) : base;

  return options.format === 'jpeg' ? withOrientation.jpeg().toBuffer() : withOrientation.png().toBuffer();
}

// A `/uploads/...` URL from the API back to its file on disk.
function pathFromUrl(url: string): string {
  return join(env.UPLOADS_DIR, url.slice(`${UPLOADS_URL_PREFIX}/`.length));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);

    return true;
  } catch (error: unknown) {
    if (isMissingFile(error)) return false;

    throw error;
  }
}

export async function storedFileExists(url: string): Promise<boolean> {
  return pathExists(pathFromUrl(url));
}

export async function storedFileSize(url: string): Promise<number> {
  const fileStat = await stat(pathFromUrl(url));

  return fileStat.size;
}

export type StoredFileMetadata = { width: number; height: number; hasExif: boolean };

// What a stored file really is, decoded from disk: for the tests that check the pipeline's output.
export async function readStoredFileMetadata(url: string): Promise<StoredFileMetadata> {
  const metadata = await sharp(pathFromUrl(url)).metadata();

  return { width: metadata.width, height: metadata.height, hasExif: metadata.exif !== undefined };
}

export async function funkoFolderExists(funkoId: number): Promise<boolean> {
  return pathExists(funkoFolder(funkoId));
}

export async function listFunkoFolder(funkoId: number): Promise<string[]> {
  return readdir(funkoFolder(funkoId));
}

// Copies one file inside a funko's folder, e.g. to leave a file behind that no row points at.
export async function copyFunkoFile(funkoId: number, fromName: string, toName: string): Promise<void> {
  const folder = funkoFolder(funkoId);

  await copyFile(join(folder, fromName), join(folder, toName));
  forgetStoredFiles();
}
