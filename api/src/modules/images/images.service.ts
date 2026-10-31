import {
  listStoredImageFiles,
  pruneOrphanFiles,
  readImageDimensions,
  storedFileKey,
  storedFileUrl,
  sizeFileName,
  type ImageSize,
  type StoredImageFiles,
} from '../../lib/imageStorage.ts';
import { toSkipTake } from '../../lib/pagination.ts';
import { imagesRepository, type LinkedImageRow } from './images.repository.ts';
import type {
  ImageGroup,
  ImageGroupListResponse,
  ImageListEntry,
  ImageListResponse,
  ImageSortField,
  ListImagesQuery,
} from './images.schema.ts';

// The group the loose files share in the grouped list.
const LOOSE_GROUP_KEY = 'loose';
// Which stored size to read a loose file's dimensions from, best first.
const DIMENSION_SIZES: ImageSize[] = ['large', 'medium', 'small'];

type Comparator = (first: ImageListEntry, second: ImageListEntry) => number;

const SORT_COMPARATORS: Record<ImageSortField, Comparator> = {
  CREATION_DATE: (first, second) => first.createdAt.localeCompare(second.createdAt),
  SIZE: (first, second) => first.sizeBytes - second.sizeBytes,
  NAME: (first, second) => displayName(first).localeCompare(displayName(second)),
};

const EVERY_IMAGE_QUERY: ListImagesQuery = { page: 1, size: 1, sorting_fields: 'NAME', direction: 'ASC' };

const GROUP_COMPARATORS: Record<ImageSortField, (first: ImageGroup, second: ImageGroup) => number> = {
  CREATION_DATE: (first, second) => first.newestCreatedAt.localeCompare(second.newestCreatedAt),
  SIZE: (first, second) => first.sizeBytes - second.sizeBytes,
  NAME: (first, second) => (first.funko?.name ?? '').localeCompare(second.funko?.name ?? ''),
};

function displayName(entry: ImageListEntry): string {
  return (entry.funko?.name ?? entry.fileName).toLowerCase();
}

function storageKey(folder: string | number, fileKey: string): string {
  return `${folder}/${fileKey}`;
}

// The funko's main image is its first by position (then by id), as on the funko's page.
function mainImageIds(rows: LinkedImageRow[]): Set<number> {
  const firstByFunko = new Map<number, LinkedImageRow>();

  for (const row of rows) {
    const current = firstByFunko.get(row.funkoId);
    const isEarlier =
      !current || row.position < current.position || (row.position === current.position && row.id < current.id);

    if (isEarlier) firstByFunko.set(row.funkoId, row);
  }

  return new Set([...firstByFunko.values()].map((row) => row.id));
}

function toLinkedEntry(row: LinkedImageRow, files: StoredImageFiles | undefined, mainIds: Set<number>): ImageListEntry {
  const folder = String(row.funkoId);

  return {
    key: storageKey(folder, row.fileKey),
    id: row.id,
    funko: { id: row.funkoId, name: row.funkoName, number: row.funkoNumber },
    fileName: sizeFileName(row.fileKey, 'large'),
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    sizeCount: files?.sizes.length ?? 0,
    isMain: mainIds.has(row.id),
    createdAt: row.createdAt.toISOString(),
    url: storedFileUrl(folder, row.fileKey, 'large'),
    mediumUrl: storedFileUrl(folder, row.fileKey, 'medium'),
    smallUrl: storedFileUrl(folder, row.fileKey, 'small'),
    placeholder: row.placeholder,
  };
}

function urlIfPresent(files: StoredImageFiles, size: ImageSize): string | null {
  return files.sizes.includes(size) ? storedFileUrl(files.folder, files.fileKey, size) : null;
}

async function toLooseEntry(files: StoredImageFiles): Promise<ImageListEntry> {
  const bestSize = DIMENSION_SIZES.find((size) => files.sizes.includes(size));
  const dimensions = bestSize ? await readImageDimensions(files.folder, files.fileKey, bestSize) : null;
  const anyUrl = bestSize ? storedFileUrl(files.folder, files.fileKey, bestSize) : null;

  return {
    key: storageKey(files.folder, files.fileKey),
    id: null,
    funko: null,
    fileName: sizeFileName(files.fileKey, bestSize ?? 'large'),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    sizeBytes: files.sizeBytes,
    sizeCount: files.sizes.length,
    isMain: false,
    createdAt: files.modifiedAt.toISOString(),
    // The full-size file, or the best one left when it is missing.
    url: urlIfPresent(files, 'large') ?? anyUrl,
    mediumUrl: urlIfPresent(files, 'medium'),
    smallUrl: urlIfPresent(files, 'small'),
    placeholder: null,
  };
}

function matchesQuery(entry: ImageListEntry, query: ListImagesQuery): boolean {
  const isFunkoMatch = query.hasFunko === undefined || (entry.funko !== null) === query.hasFunko;
  const words = query.q?.toLowerCase();
  const isTextMatch =
    !words ||
    entry.fileName.toLowerCase().includes(words) ||
    (entry.funko?.name.toLowerCase().includes(words) ?? false);

  return isFunkoMatch && isTextMatch;
}

// Every image the app holds: the rows (each with its funko) and the loose files on disk no row points at, filtered
// and sorted here, together, since the two come from different places.
async function collectEntries(query: ListImagesQuery): Promise<ImageListEntry[]> {
  const [rows, storedFiles] = await Promise.all([imagesRepository.listLinked(), listStoredImageFiles()]);
  const filesByKey = new Map(storedFiles.map((files) => [storageKey(files.folder, files.fileKey), files]));
  const mainIds = mainImageIds(rows);
  const linkedKeys = new Set(rows.map((row) => storedFileKey(row.funkoId, row.fileKey)));

  const linked = rows.map((row) => toLinkedEntry(row, filesByKey.get(storageKey(row.funkoId, row.fileKey)), mainIds));
  const looseFiles = storedFiles.filter((files) => !linkedKeys.has(storageKey(files.folder, files.fileKey)));
  const loose = await Promise.all(looseFiles.map(toLooseEntry));

  const compare = SORT_COMPARATORS[query.sorting_fields];
  const directionFactor = directionFactorOf(query);

  return [...linked, ...loose]
    .filter((entry) => matchesQuery(entry, query))
    .sort((first, second) => compare(first, second) * directionFactor || first.key.localeCompare(second.key));
}

function directionFactorOf(query: ListImagesQuery): number {
  return query.direction === 'DESC' ? -1 : 1;
}

// Every image (rows and loose files), by funko name, for the export: no paging, no filter.
export async function getAllImages(): Promise<ImageListEntry[]> {
  return collectEntries({ ...EVERY_IMAGE_QUERY });
}

export async function getImages(query: ListImagesQuery): Promise<ImageListResponse> {
  const matching = await collectEntries(query);
  const { skip, take } = toSkipTake(query);

  return { data: matching.slice(skip, skip + take), totalResultNumber: matching.length, currentPage: query.page };
}

// One funko's images (or all the loose files) with their totals. Its images keep the list's order.
function toGroup(groupKey: string, images: ImageListEntry[]): ImageGroup {
  const [first] = images;
  const newest = images.reduce((latest, image) => (image.createdAt > latest ? image.createdAt : latest), '');

  return {
    key: groupKey,
    funko: first?.funko ?? null,
    imageCount: images.length,
    sizeBytes: images.reduce((total, image) => total + image.sizeBytes, 0),
    newestCreatedAt: newest,
    images,
  };
}

// The same images, one group per funko, sorted by the group's total (size), newest image (date) or funko name.
// The loose files form one group of their own, always last. Groups are what is paged.
export async function getImageGroups(query: ListImagesQuery): Promise<ImageGroupListResponse> {
  const matching = await collectEntries(query);
  const byGroup = new Map<string, ImageListEntry[]>();

  for (const entry of matching) {
    const groupKey = entry.funko ? String(entry.funko.id) : LOOSE_GROUP_KEY;

    byGroup.set(groupKey, [...(byGroup.get(groupKey) ?? []), entry]);
  }

  const groups = [...byGroup.entries()].map(([groupKey, images]) => toGroup(groupKey, images));
  const funkoGroups = groups.filter((group) => group.funko !== null);
  const looseGroups = groups.filter((group) => group.funko === null);
  const compare = GROUP_COMPARATORS[query.sorting_fields];
  const directionFactor = directionFactorOf(query);
  funkoGroups.sort((first, second) => compare(first, second) * directionFactor || first.key.localeCompare(second.key));
  const ordered = [...funkoGroups, ...looseGroups];
  const { skip, take } = toSkipTake(query);

  return { data: ordered.slice(skip, skip + take), totalResultNumber: ordered.length, currentPage: query.page };
}

// Deletes the image files on disk that no row points at (and folders left empty). Returns how many files went.
export async function deleteOrphanImageFiles(): Promise<number> {
  const rows = await imagesRepository.listLinked();
  const knownKeys = new Set(rows.map((row) => storedFileKey(row.funkoId, row.fileKey)));

  return pruneOrphanFiles(knownKeys);
}
