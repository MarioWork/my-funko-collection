// The rules of the API's GET /export/funkos.{csv,json,xlsx} over the mock store: which funkos one filter keeps,
// the file name, and the lines every format is built from.
import { readableFunkos } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockItemRow } from '@mocks/mockStore.type';
import { ExportFunkosScopeUtil } from '@app-types/utility';

export const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';
export const CSV_LINE_BREAK = '\r\n';
export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TAG_SEPARATOR = '; ';
export const CENTS_PER_UNIT = 100;
const PRICE_DECIMALS = 2;
const ALL_FUNKOS_FILE_BASE = 'my-funko-collection-funkos';
const NON_FILE_NAME_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;
const NEEDS_QUOTING = /[",\r\n]/;
export const CSV_HEADER = [
  'collection',
  'funko_id',
  'name',
  'number',
  'category',
  'series',
  'type',
  'is_chase',
  'exclusive',
  'barcode',
  'quantity',
  'condition',
  'purchase_price',
  'purchase_currency',
  'purchased_at',
  'tags',
  'notes',
  'image_urls',
];

export type Cell = string | number | boolean | null;

// How each filter narrows the store, and what the file is called: the same rules as the API's GET /export/funkos.csv.
type ScopeReader = {
  fileKind: string;
  nameOf: (id: number) => string | undefined;
  isFunkoIncluded?: (funko: MockFunkoRow, id: number) => boolean;
  isItemIncluded?: (item: MockItemRow, id: number) => boolean;
};

const SCOPE_READERS: Record<ExportFunkosScopeUtil, ScopeReader> = {
  [ExportFunkosScopeUtil.CATEGORY]: {
    fileKind: 'category',
    nameOf: (id) => mockStore.categories.find((category) => category.id === id)?.name,
    isFunkoIncluded: (funko, id) => funko.categoryId === id,
  },
  [ExportFunkosScopeUtil.SERIES]: {
    fileKind: 'series',
    nameOf: (id) => mockStore.series.find((oneSeries) => oneSeries.id === id)?.name,
    isFunkoIncluded: (funko, id) => funko.seriesId === id,
  },
  [ExportFunkosScopeUtil.COLLECTION]: {
    fileKind: 'collection',
    nameOf: (id) => mockStore.collections.find((collection) => collection.id === id)?.name,
    isItemIncluded: (item, id) => item.collectionId === id,
  },
  [ExportFunkosScopeUtil.FUNKO]: {
    fileKind: 'funko',
    nameOf: (id) => mockStore.funkos.find((funko) => funko.id === id)?.name,
    isFunkoIncluded: (funko, id) => funko.id === id,
  },
  [ExportFunkosScopeUtil.TAG]: {
    fileKind: 'tag',
    nameOf: (id) => mockStore.tags.find((tag) => tag.id === id)?.name,
    isItemIncluded: (item, id) => item.tagIds.includes(id),
  },
};

function toCell(value: Cell): string {
  if (value === null) return '';

  const text = String(value);

  return NEEDS_QUOTING.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// A funko in readable form (names, not ids), as the API's JSON export shows it.
export function toFunkoFields(funko: MockFunkoRow) {
  return {
    id: funko.id,
    name: funko.name,
    number: funko.number,
    category: mockStore.categories.find((category) => category.id === funko.categoryId)?.name ?? '',
    series: mockStore.series.find((oneSeries) => oneSeries.id === funko.seriesId)?.name ?? null,
    type: funko.type,
    isChase: funko.isChase,
    exclusive: funko.exclusive,
    barcode: funko.barcode,
    imageUrls: mockStore.images.filter((image) => image.funkoId === funko.id).map((image) => image.url),
  };
}

// One of its items in readable form; the price in units (14.99), not cents.
export function toItemFields(item: MockItemRow) {
  return {
    collection: mockStore.collections.find((collection) => collection.id === item.collectionId)?.name ?? '',
    quantity: item.quantity,
    condition: item.condition,
    purchasePrice: item.purchasePriceCents === null ? null : item.purchasePriceCents / CENTS_PER_UNIT,
    purchaseCurrency: item.purchaseCurrency,
    purchasedAt: item.purchasedAt,
    tags: item.tagIds.map((tagId) => mockStore.tags.find((tag) => tag.id === tagId)?.name ?? ''),
    notes: item.notes,
  };
}

// The cells of one line, in CSV_HEADER's order.
export function toCells(funko: MockFunkoRow, item: MockItemRow | null): Cell[] {
  const fields = toFunkoFields(funko);
  const itemFields = item ? toItemFields(item) : null;

  return [
    itemFields?.collection ?? null,
    fields.id,
    fields.name,
    fields.number,
    fields.category,
    fields.series,
    fields.type,
    fields.isChase,
    fields.exclusive,
    fields.barcode,
    itemFields?.quantity ?? null,
    itemFields?.condition ?? null,
    itemFields?.purchasePrice?.toFixed(PRICE_DECIMALS) ?? null,
    itemFields?.purchaseCurrency ?? null,
    itemFields?.purchasedAt ?? null,
    itemFields?.tags.join(TAG_SEPARATOR) ?? '',
    itemFields?.notes ?? null,
    fields.imageUrls.join(' '),
  ];
}

export function toCsvLine(cells: Cell[]): string {
  return cells.map(toCell).join(',');
}

function toFileBase(kind: string, name: string): string {
  return `${kind}-${name.toLowerCase().replace(NON_FILE_NAME_CHARACTERS, '-').replace(EDGE_DASHES, '')}`;
}

export type ExportLine = { funko: MockFunkoRow; item: MockItemRow | null };

// One line per funko and item; with a category or series filter (or none), a funko in no collection gets one line.
function linesFor(reader: ScopeReader | undefined, id: number): ExportLine[] {
  return readableFunkos().flatMap((funko): ExportLine[] => {
    const items = mockStore.items.filter((item) => item.funkoId === funko.id);

    if (reader?.isItemIncluded) {
      return items.filter((item) => reader.isItemIncluded?.(item, id)).map((item) => ({ funko, item }));
    }

    const isIncluded = reader?.isFunkoIncluded?.(funko, id) ?? true;

    if (!isIncluded) return [];

    return items.length === 0 ? [{ funko, item: null }] : items.map((item) => ({ funko, item }));
  });
}

type ScopedExport = {
  fileBase: string;
  scope: { kind: string; name: string } | null;
  lines: ExportLine[];
};

// The filter in a request's query (one at most), resolved; undefined when its id does not exist (a 404).
export function readScopedExport(requestUrl: string): ScopedExport | undefined {
  const params = new URL(requestUrl).searchParams;
  const scope = Object.values(ExportFunkosScopeUtil).find((param) => params.has(param));

  if (!scope) return { fileBase: ALL_FUNKOS_FILE_BASE, scope: null, lines: linesFor(undefined, 0) };

  const id = Number(params.get(scope));
  const reader = SCOPE_READERS[scope];
  const name = reader.nameOf(id);

  if (name === undefined) return undefined;

  return {
    fileBase: toFileBase(reader.fileKind, name),
    scope: { kind: reader.fileKind, name },
    lines: linesFor(reader, id),
  };
}

export function attachment(fileName: string): string {
  return `attachment; filename="${fileName}"`;
}

// The lines of one entry of a whole-list export (its funkos and their items there).
export function linesOfEntry(scope: ExportFunkosScopeUtil, id: number): ExportLine[] {
  return linesFor(SCOPE_READERS[scope], id);
}
