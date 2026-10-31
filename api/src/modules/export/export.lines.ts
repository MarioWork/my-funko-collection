// The data side of every export: loads the tables once, resolves ids to names, and builds export lines (a funko
// and one of its items) for a scope (one category, series, collection or tag, or everything).
import { env } from '../../config/env.ts';
import { NotFoundError } from '../../lib/httpErrors.ts';
import { sizeUrl } from '../../lib/imageStorage.ts';
import { exportRepository } from './export.repository.ts';
import type { ExportFunkosQuery, ExportListKind, ExportScopeKind, FunkoExportLine } from './export.schema.ts';

const CENTS_PER_UNIT = 100;
const ALL_FUNKOS_FILE_BASE = 'my-funko-collection-funkos';
const FALLBACK_FILE_NAME_SLUG = 'export';
const NON_FILE_NAME_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;

const SCOPE_READERS: Record<ScopeFilter, ScopeReader> = {
  categoryId: {
    entity: 'Category',
    fileKind: 'category',
    names: (lookups) => lookups.categoryNames,
    funkoFilter: (id) => (funko) => funko.categoryId === id,
  },
  seriesId: {
    entity: 'Series',
    fileKind: 'series',
    names: (lookups) => lookups.seriesNames,
    funkoFilter: (id) => (funko) => funko.seriesId === id,
  },
  collectionId: {
    entity: 'Collection',
    fileKind: 'collection',
    names: (lookups) => lookups.collectionNames,
    itemFilter: (id) => (item) => item.collectionId === id,
  },
  funkoId: {
    entity: 'Funko',
    fileKind: 'funko',
    names: (lookups) => lookups.funkoNames,
    funkoFilter: (id) => (funko) => funko.id === id,
  },
  tagId: {
    entity: 'Tag',
    fileKind: 'tag',
    names: (lookups) => lookups.tagNames,
    itemFilter: (id, lookups) => (item) => itemTagIds(item, lookups).includes(id),
  },
};

const EVERY_FUNKO_SCOPE: FunkosCsvScope = { fileBase: ALL_FUNKOS_FILE_BASE, label: null, isFunkoIncluded: () => true };

const LIST_READERS: Record<ExportListKind, ListReader> = {
  categories: {
    scopeFilter: 'categoryId',
    entries: (data) => {
      const funkoCounts = countBy(data.funkos, (funko) => funko.categoryId);

      return data.categories
        .map(({ id, name }) => ({ id, name, summary: { id, name, funkoCount: funkoCounts.get(id) ?? 0 } }))
        .sort(byName);
    },
  },
  series: {
    scopeFilter: 'seriesId',
    entries: (data) => {
      const funkoCounts = countBy(data.funkos, (funko) => funko.seriesId);

      return data.series
        .map(({ id, name }) => ({ id, name, summary: { id, name, funkoCount: funkoCounts.get(id) ?? 0 } }))
        .sort(byName);
    },
  },
  collections: {
    scopeFilter: 'collectionId',
    entries: (data) => {
      const itemsByCollection = groupBy(data.items, (item) => item.collectionId);

      return data.collections
        .map(({ id, name, notes, isDefault }) => ({
          id,
          name,
          summary: { id, name, notes, isDefault, ...collectionTotals(itemsByCollection.get(id) ?? []) },
        }))
        .sort(byName);
    },
  },
  tags: {
    scopeFilter: 'tagId',
    entries: (data) => {
      const itemCounts = countBy(data.itemTags, (itemTag) => itemTag.tagId);

      return data.tags
        .map(({ id, name, notes }) => ({ id, name, summary: { id, name, notes, itemCount: itemCounts.get(id) ?? 0 } }))
        .sort(byName);
    },
  },
};

export function groupBy<Row, Key>(rows: Row[], keyOf: (row: Row) => Key): Map<Key, Row[]> {
  const grouped = new Map<Key, Row[]>();

  for (const row of rows) {
    const key = keyOf(row);
    const bucket = grouped.get(key) ?? [];

    bucket.push(row);
    grouped.set(key, bucket);
  }

  return grouped;
}

// Everything one export needs, for the signed-in user: the whole catalogue, and only their own lists.
export async function loadEverything(userId: number) {
  const [categories, series, funkos, images, collections, tags, items, itemTags] = await Promise.all([
    exportRepository.categories(),
    exportRepository.series(),
    exportRepository.funkos(),
    exportRepository.images(),
    exportRepository.collections(userId),
    exportRepository.tags(),
    exportRepository.items(userId),
    exportRepository.itemTags(userId),
  ]);

  return { categories, series, funkos, images, collections, tags, items, itemTags };
}

export type EverythingData = Awaited<ReturnType<typeof loadEverything>>;
export type FunkoRow = EverythingData['funkos'][number];
export type ItemRow = EverythingData['items'][number];

// Names by id, built once per export, for the readable columns.
export function buildLookups(data: EverythingData) {
  return {
    categoryNames: new Map(data.categories.map((category) => [category.id, category.name])),
    seriesNames: new Map(data.series.map((oneSeries) => [oneSeries.id, oneSeries.name])),
    collectionNames: new Map(data.collections.map((collection) => [collection.id, collection.name])),
    tagNames: new Map(data.tags.map((tag) => [tag.id, tag.name])),
    tagIdsByItem: groupBy(data.itemTags, (itemTag) => itemTag.itemId),
    funkoNames: new Map(data.funkos.map((funko) => [funko.id, funko.name])),
    // Already ordered by position, so the main image comes first.
    imagesByFunko: groupBy(data.images, (image) => image.funkoId),
  };
}

// Absolute links, so a link copied out of a spreadsheet still opens the image.
function imageUrlsOf(funkoId: number, lookups: Lookups): string[] {
  const images = lookups.imagesByFunko.get(funkoId) ?? [];

  return images.map((image) => new URL(sizeUrl(funkoId, image.fileKey, 'large'), env.APP_ORIGIN).toString());
}

export type Lookups = ReturnType<typeof buildLookups>;

function itemTagIds(item: ItemRow, lookups: Lookups): number[] {
  return (lookups.tagIdsByItem.get(item.id) ?? []).map((itemTag) => itemTag.tagId);
}

export function centsToUnits(cents: number | null): number | null {
  return cents === null ? null : cents / CENTS_PER_UNIT;
}

// A funko and one of its items in readable form (names, not ids): the unit every export format is built from.
export function toExportLine(funko: FunkoRow, item: ItemRow | null, lookups: Lookups): FunkoExportLine {
  const fields = {
    id: funko.id,
    name: funko.name,
    number: funko.number,
    category: lookups.categoryNames.get(funko.categoryId) ?? '',
    series: funko.seriesId === null ? null : (lookups.seriesNames.get(funko.seriesId) ?? ''),
    type: funko.type,
    isChase: funko.isChase,
    exclusive: funko.exclusive,
    barcode: funko.barcode,
    imageUrls: imageUrlsOf(funko.id, lookups),
  };

  if (!item) return { funko: fields, item: null, itemId: null };

  return {
    funko: fields,
    itemId: item.id,
    item: {
      collection: lookups.collectionNames.get(item.collectionId) ?? '',
      quantity: item.quantity,
      condition: item.condition,
      purchasePrice: centsToUnits(item.purchasePriceCents),
      purchaseCurrency: item.purchaseCurrency,
      purchasedAt: item.purchasedAt,
      tags: itemTagIds(item, lookups).map((tagId) => lookups.tagNames.get(tagId) ?? ''),
      notes: item.notes,
    },
  };
}

export function toFileBase(kind: string, name: string): string {
  const slug = name.toLowerCase().replace(NON_FILE_NAME_CHARACTERS, '-').replace(EDGE_DASHES, '');

  return `${kind}-${slug || FALLBACK_FILE_NAME_SLUG}`;
}
export type FunkosCsvScope = {
  // The download's name without its extension, and what it was narrowed to (null: every funko).
  fileBase: string;
  label: { kind: ExportScopeKind; name: string } | null;
  isFunkoIncluded: (funko: FunkoRow) => boolean;
  // Undefined: every item of an included funko, and one line for a funko in no collection.
  isItemIncluded?: (item: ItemRow) => boolean;
};

export type ScopeFilter = keyof ExportFunkosQuery;

type ScopeReader = {
  entity: string;
  fileKind: ExportScopeKind;
  names: (lookups: Lookups) => Map<number, string>;
  // Category and series narrow the funkos; collection and tag narrow their items.
  funkoFilter?: (id: number) => (funko: FunkoRow) => boolean;
  itemFilter?: (id: number, lookups: Lookups) => (item: ItemRow) => boolean;
};

// The one filter the query sets, with its id; undefined when it sets none (the schema allows one at most).
function readScopeFilter(query: ExportFunkosQuery): [ScopeFilter, number] | undefined {
  const filters = Object.keys(SCOPE_READERS) as ScopeFilter[];
  const filter = filters.find((key) => query[key] !== undefined);
  const id = filter ? query[filter] : undefined;

  return filter && id !== undefined ? [filter, id] : undefined;
}

// Which funkos (and which of their items) one filter keeps, and the file it downloads as. A filter id that does
// not exist is a 404, not an empty file.
export function toFunkosCsvScope(query: ExportFunkosQuery, data: EverythingData, lookups: Lookups): FunkosCsvScope {
  const scopeFilter = readScopeFilter(query);

  if (!scopeFilter) return EVERY_FUNKO_SCOPE;

  const [filter, id] = scopeFilter;
  const reader = SCOPE_READERS[filter];
  const name = reader.names(lookups).get(id);

  if (name === undefined) throw new NotFoundError(reader.entity, id);

  const fileBase = toFileBase(reader.fileKind, name);
  const label = { kind: reader.fileKind, name };

  if (reader.funkoFilter) return { fileBase, label, isFunkoIncluded: reader.funkoFilter(id) };

  const isItemIncluded = reader.itemFilter?.(id, lookups) ?? (() => true);
  const funkoIds = new Set(data.items.filter(isItemIncluded).map((item) => item.funkoId));

  return { fileBase, label, isFunkoIncluded: (funko) => funkoIds.has(funko.id), isItemIncluded };
}

// The lines a scope keeps: one per funko and item it has there, or one with no item for a funko in no collection
// (category, series and no filter only).
export function collectScopedLines(scope: FunkosCsvScope, data: EverythingData, lookups: Lookups): FunkoExportLine[] {
  const itemsByFunko = groupBy(data.items, (item) => item.funkoId);

  return data.funkos.filter(scope.isFunkoIncluded).flatMap((funko) => {
    const funkoItems = itemsByFunko.get(funko.id) ?? [];

    if (scope.isItemIncluded) {
      return funkoItems.filter(scope.isItemIncluded).map((item) => toExportLine(funko, item, lookups));
    }

    if (funkoItems.length === 0) return [toExportLine(funko, null, lookups)];

    return funkoItems.map((item) => toExportLine(funko, item, lookups));
  });
}

// --- Whole lists (every category, series, collection or tag) ----------------------------------------------------

// One entry of a list export: its id and name, its summary columns, and the filter that selects its funkos.
export type ListEntry = { id: number; name: string; summary: Record<string, string | number | boolean | null> };

type ListReader = {
  scopeFilter: ScopeFilter;
  entries: (data: EverythingData, lookups: Lookups) => ListEntry[];
};

function countBy<Row>(rows: Row[], keyOf: (row: Row) => number | null): Map<number | null, number> {
  const counts = new Map<number | null, number>();

  for (const row of rows) counts.set(keyOf(row), (counts.get(keyOf(row)) ?? 0) + 1);

  return counts;
}

function byName(first: ListEntry, second: ListEntry): number {
  return first.name.localeCompare(second.name);
}

function collectionTotals(items: ItemRow[]) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSpentCents = items.reduce((sum, item) => sum + (item.purchasePriceCents ?? 0) * item.quantity, 0);

  return { itemCount: items.length, totalQuantity, totalSpent: totalSpentCents / CENTS_PER_UNIT };
}

export function toListEntries(kind: ExportListKind, data: EverythingData, lookups: Lookups): ListEntry[] {
  return LIST_READERS[kind].entries(data, lookups);
}

// The lines one entry of a list holds (its funkos and their items there).
export function collectEntryLines(
  kind: ExportListKind,
  entry: ListEntry,
  data: EverythingData,
  lookups: Lookups,
): FunkoExportLine[] {
  const scope = toFunkosCsvScope({ [LIST_READERS[kind].scopeFilter]: entry.id }, data, lookups);

  return collectScopedLines(scope, data, lookups);
}
