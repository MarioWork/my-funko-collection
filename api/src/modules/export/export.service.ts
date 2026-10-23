import { env } from '../../config/env.ts';
import { readVariantAsJpeg } from '../../lib/imageStorage.ts';
import { getAllImages } from '../images/images.service.ts';
import type { ImageListEntry } from '../images/images.type.ts';
import { toCsv, toFunkoTree, toImagesCsv, toListCsv } from './export.formats.ts';
import {
  buildLookups,
  collectEntryLines,
  collectScopedLines,
  groupBy,
  loadEverything,
  toExportLine,
  toFunkosCsvScope,
  toListEntries,
  type Lookups,
} from './export.lines.ts';
import type {
  ExportFunko,
  ExportFunkosQuery,
  ExportItem,
  ExportListKind,
  ExportListQuery,
  ExportResponse,
  FunkoExportLine,
  FunkosExportResponse,
  ImageExport,
  ImagesExportResponse,
  ListExportResponse,
} from './export.schema.ts';
import { toImagesSpreadsheet, toListSpreadsheet, toSpreadsheet, type SheetPhoto } from './export.spreadsheet.ts';

const LIST_FILE_PREFIX = 'my-funko-collection';
const WITH_FUNKOS_SUFFIX = '-with-funkos';
const IMAGES_FILE_BASE = 'my-funko-collection-images';

export type ExportFile<Content> = { fileName: string; content: Content };

export async function getExport(): Promise<ExportResponse> {
  const data = await loadEverything();
  const imagesByFunko = groupBy(data.images, (image) => image.funkoId);
  const tagIdsByItem = groupBy(data.itemTags, (itemTag) => itemTag.itemId);

  const funkos: ExportFunko[] = data.funkos.map((funko) => ({
    ...funko,
    images: (imagesByFunko.get(funko.id) ?? []).map(({ id, fileKey, position }) => ({ id, fileKey, position })),
    createdAt: funko.createdAt.toISOString(),
    updatedAt: funko.updatedAt.toISOString(),
  }));

  const items: ExportItem[] = data.items.map((item) => ({
    ...item,
    tagIds: (tagIdsByItem.get(item.id) ?? []).map((itemTag) => itemTag.tagId),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return {
    exportedAt: new Date().toISOString(),
    categories: data.categories,
    series: data.series,
    funkos,
    collections: data.collections,
    tags: data.tags,
    items,
  };
}

// One line per collection item, readable in any spreadsheet.
export async function getItemsCsv(): Promise<string> {
  const data = await loadEverything();
  const lookups = buildLookups(data);
  const funkosById = new Map(data.funkos.map((funko) => [funko.id, funko]));

  const lines = data.items.flatMap((item) => {
    const funko = funkosById.get(item.funkoId);

    return funko ? [toExportLine(funko, item, lookups)] : [];
  });

  return toCsv(lines);
}

// --- The funkos of one category, series, collection or tag --------------------------------------------------------

async function getScopedLines(query: ExportFunkosQuery) {
  const data = await loadEverything();
  const lookups = buildLookups(data);
  const scope = toFunkosCsvScope(query, data, lookups);

  return { scope, lines: collectScopedLines(scope, data, lookups), lookups };
}

// One funko's photos for the spreadsheet, main first, at the 480 px size (sharp enough at the size shown, and it
// keeps the file small). A file missing on disk is left out.
async function loadSheetPhotos(funkoId: number, lookups: Lookups): Promise<SheetPhoto[]> {
  const images = lookups.imagesByFunko.get(funkoId) ?? [];
  const photos = await Promise.all(images.map((image) => readVariantAsJpeg(funkoId, image.fileKey, 'small')));

  return photos.filter((photo) => photo !== undefined);
}

export async function getFunkosCsv(query: ExportFunkosQuery): Promise<ExportFile<string>> {
  const { scope, lines } = await getScopedLines(query);

  return { fileName: `${scope.fileBase}.csv`, content: toCsv(lines) };
}

// A single funko's spreadsheet also carries its photos, on a sheet of their own; a bigger scope only links them.
export async function getFunkosSpreadsheet(query: ExportFunkosQuery): Promise<ExportFile<Buffer>> {
  const { scope, lines, lookups } = await getScopedLines(query);
  const photos = query.funkoId === undefined ? [] : await loadSheetPhotos(query.funkoId, lookups);

  return { fileName: `${scope.fileBase}.xlsx`, content: await toSpreadsheet(lines, photos) };
}

export async function getFunkosJson(query: ExportFunkosQuery): Promise<ExportFile<FunkosExportResponse>> {
  const { scope, lines } = await getScopedLines(query);
  const content = { exportedAt: new Date().toISOString(), scope: scope.label, funkos: toFunkoTree(lines) };

  return { fileName: `${scope.fileBase}.json`, content };
}

// --- Whole lists: every category, series, collection or tag, with or without their funkos -------------------------

function listFileBase(kind: ExportListKind, includeFunkos: boolean): string {
  return `${LIST_FILE_PREFIX}-${kind}${includeFunkos ? WITH_FUNKOS_SUFFIX : ''}`;
}

async function getListData(kind: ExportListKind) {
  const data = await loadEverything();
  const lookups = buildLookups(data);
  const entries = toListEntries(kind, data, lookups);
  const linesOf = (entry: (typeof entries)[number]) => collectEntryLines(kind, entry, data, lookups);

  return { entries, linesOf };
}

// Every line of every entry, each once: an item carrying two tags would otherwise show up under both.
function uniqueLines(lineGroups: FunkoExportLine[][]): FunkoExportLine[] {
  const seen = new Set<FunkoExportLine['itemId'] | string>();

  return lineGroups.flat().filter((line) => {
    const key = line.itemId ?? `funko-${line.funko.id}`;
    const isNew = !seen.has(key);

    seen.add(key);

    return isNew;
  });
}

// CSV holds one table: the list itself, or (with funkos) the funkos of every entry, each line once.
export async function getListCsv(
  kind: ExportListKind,
  { includeFunkos }: ExportListQuery,
): Promise<ExportFile<string>> {
  const { entries, linesOf } = await getListData(kind);
  const content = includeFunkos ? toCsv(uniqueLines(entries.map(linesOf))) : toListCsv(kind, entries);

  return { fileName: `${listFileBase(kind, includeFunkos)}.csv`, content };
}

// A spreadsheet: the list as a table or, with funkos, one sheet where each entry folds open onto its funkos (an
// item with two tags sits under both).
export async function getListSpreadsheet(
  kind: ExportListKind,
  { includeFunkos }: ExportListQuery,
): Promise<ExportFile<Buffer>> {
  const { entries, linesOf } = await getListData(kind);
  const groups = includeFunkos ? entries.map((entry) => ({ entry, lines: linesOf(entry) })) : null;

  return {
    fileName: `${listFileBase(kind, includeFunkos)}.xlsx`,
    content: await toListSpreadsheet(kind, entries, groups),
  };
}

// JSON nests: each entry carries its own funkos (an item with two tags appears under both).
export async function getListJson(
  kind: ExportListKind,
  { includeFunkos }: ExportListQuery,
): Promise<ExportFile<ListExportResponse>> {
  const { entries, linesOf } = await getListData(kind);
  const content = {
    exportedAt: new Date().toISOString(),
    kind,
    includesFunkos: includeFunkos,
    entries: entries.map((entry) => {
      const fields = { ...entry.summary, id: entry.id, name: entry.name };

      return includeFunkos ? { ...fields, funkos: toFunkoTree(linesOf(entry)) } : fields;
    }),
  };

  return { fileName: `${listFileBase(kind, includeFunkos)}.json`, content };
}

// --- Every stored image: what it is and links to it, never the files themselves -------------------------------------

function absoluteUrl(url: string | null): string | null {
  return url === null ? null : new URL(url, env.APP_ORIGIN).toString();
}

function toImageExport(entry: ImageListEntry): ImageExport {
  return {
    funkoId: entry.funko?.id ?? null,
    funkoName: entry.funko?.name ?? null,
    funkoNumber: entry.funko?.number ?? null,
    fileName: entry.fileName,
    isMain: entry.isMain,
    width: entry.width,
    height: entry.height,
    sizeBytes: entry.sizeBytes,
    uploadedAt: entry.createdAt,
    url: absoluteUrl(entry.url),
    mediumUrl: absoluteUrl(entry.mediumUrl),
    smallUrl: absoluteUrl(entry.smallUrl),
  };
}

async function getImageExports(): Promise<ImageExport[]> {
  const entries = await getAllImages();

  return entries.map(toImageExport);
}

export async function getImagesCsv(): Promise<ExportFile<string>> {
  return { fileName: `${IMAGES_FILE_BASE}.csv`, content: toImagesCsv(await getImageExports()) };
}

export async function getImagesSpreadsheet(): Promise<ExportFile<Buffer>> {
  return { fileName: `${IMAGES_FILE_BASE}.xlsx`, content: await toImagesSpreadsheet(await getImageExports()) };
}

export async function getImagesJson(): Promise<ExportFile<ImagesExportResponse>> {
  const content = { exportedAt: new Date().toISOString(), images: await getImageExports() };

  return { fileName: `${IMAGES_FILE_BASE}.json`, content };
}
