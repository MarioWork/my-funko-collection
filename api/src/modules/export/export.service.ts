import { exportRepository } from './export.repository.ts';
import type { ExportFunko, ExportItem, ExportResponse } from './export.schema.ts';

const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\r\n';
const CSV_HEADER = [
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
] as const;
const CENTS_PER_UNIT = 100;
const NEEDS_QUOTING = /[",\r\n]/;

function groupBy<Row, Key>(rows: Row[], keyOf: (row: Row) => Key): Map<Key, Row[]> {
  const grouped = new Map<Key, Row[]>();

  for (const row of rows) {
    const key = keyOf(row);
    const bucket = grouped.get(key) ?? [];

    bucket.push(row);
    grouped.set(key, bucket);
  }

  return grouped;
}

async function loadEverything() {
  const [categories, series, funkos, images, collections, tags, items, itemTags] = await Promise.all([
    exportRepository.categories(),
    exportRepository.series(),
    exportRepository.funkos(),
    exportRepository.images(),
    exportRepository.collections(),
    exportRepository.tags(),
    exportRepository.items(),
    exportRepository.itemTags(),
  ]);

  return { categories, series, funkos, images, collections, tags, items, itemTags };
}

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

// RFC 4180: quote a cell when it holds a separator, a quote or a line break; double the quotes inside.
function toCsvCell(value: string | number | boolean | null): string {
  if (value === null) return '';

  const text = String(value);

  if (!NEEDS_QUOTING.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvLine(cells: (string | number | boolean | null)[]): string {
  return cells.map(toCsvCell).join(CSV_SEPARATOR);
}

function centsToUnits(cents: number | null): string | null {
  return cents === null ? null : (cents / CENTS_PER_UNIT).toFixed(2);
}

// One line per collection item, readable in any spreadsheet.
export async function getItemsCsv(): Promise<string> {
  const data = await loadEverything();
  const categoryNames = new Map(data.categories.map((category) => [category.id, category.name]));
  const seriesNames = new Map(data.series.map((oneSeries) => [oneSeries.id, oneSeries.name]));
  const collectionNames = new Map(data.collections.map((collection) => [collection.id, collection.name]));
  const tagNames = new Map(data.tags.map((tag) => [tag.id, tag.name]));
  const funkosById = new Map(data.funkos.map((funko) => [funko.id, funko]));
  const tagIdsByItem = groupBy(data.itemTags, (itemTag) => itemTag.itemId);

  const lines = data.items.flatMap((item) => {
    const funko = funkosById.get(item.funkoId);

    if (!funko) return [];

    const itemTagNames = (tagIdsByItem.get(item.id) ?? []).map((itemTag) => tagNames.get(itemTag.tagId) ?? '');

    return [
      toCsvLine([
        collectionNames.get(item.collectionId) ?? '',
        funko.id,
        funko.name,
        funko.number,
        categoryNames.get(funko.categoryId) ?? '',
        funko.seriesId === null ? null : (seriesNames.get(funko.seriesId) ?? ''),
        funko.type,
        funko.isChase,
        funko.exclusive,
        funko.barcode,
        item.quantity,
        item.condition,
        centsToUnits(item.purchasePriceCents),
        item.purchaseCurrency,
        item.purchasedAt,
        itemTagNames.join('; '),
        item.notes,
      ]),
    ];
  });

  return [toCsvLine([...CSV_HEADER]), ...lines].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}
