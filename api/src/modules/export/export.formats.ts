// The columns of every export, and the CSV and JSON files. The service decides which lines; this file decides how
// they read. The .xlsx files are export.spreadsheet.ts, built from the same columns.
import type { ListEntry } from './export.lines.ts';
import type { ExportListKind, FunkoExport, FunkoExportLine, ImageExport } from './export.schema.ts';

const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\r\n';
const TAG_SEPARATOR = '; ';
const PHOTO_URL_SEPARATOR = ' ';
const NEEDS_QUOTING = /[",\r\n]/;
// A cell a spreadsheet would run as a formula (=, +, -, @, or a leading tab or return). Plain numbers like -12.50
// stay numbers.
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;
// The usual guard (OWASP's CSV injection advice): a leading apostrophe makes it text, which Excel and Sheets hide.
const FORMULA_ESCAPE = "'";
const PRICE_DECIMALS = 2;
// Thousands separator and cents; the currency is its own column (items can be in different ones).
export const PRICE_FORMAT = '#,##0.00';

export type CellValue = string | number | boolean | null;

// One column of every export: its CSV header, its spreadsheet title and width, and how to read it off a line.
export type ExportColumn = {
  csvHeader: string;
  title: string;
  width: number;
  valueOf: (line: FunkoExportLine) => CellValue;
  // Spreadsheet number format; set for money.
  format?: string;
};

export const COLUMNS: ExportColumn[] = [
  { csvHeader: 'collection', title: 'Collection', width: 18, valueOf: (line) => line.item?.collection ?? null },
  { csvHeader: 'funko_id', title: 'Funko id', width: 9, valueOf: (line) => line.funko.id },
  { csvHeader: 'name', title: 'Name', width: 28, valueOf: (line) => line.funko.name },
  { csvHeader: 'number', title: 'Number', width: 9, valueOf: (line) => line.funko.number },
  { csvHeader: 'category', title: 'Category', width: 18, valueOf: (line) => line.funko.category },
  { csvHeader: 'series', title: 'Series', width: 20, valueOf: (line) => line.funko.series },
  { csvHeader: 'type', title: 'Type', width: 12, valueOf: (line) => line.funko.type },
  { csvHeader: 'is_chase', title: 'Chase', width: 8, valueOf: (line) => line.funko.isChase },
  { csvHeader: 'exclusive', title: 'Exclusive', width: 14, valueOf: (line) => line.funko.exclusive },
  { csvHeader: 'barcode', title: 'Barcode', width: 15, valueOf: (line) => line.funko.barcode },
  { csvHeader: 'quantity', title: 'Quantity', width: 9, valueOf: (line) => line.item?.quantity ?? null },
  { csvHeader: 'condition', title: 'Condition', width: 14, valueOf: (line) => line.item?.condition ?? null },
  {
    csvHeader: 'purchase_price',
    title: 'Price',
    width: 10,
    valueOf: (line) => line.item?.purchasePrice ?? null,
    format: PRICE_FORMAT,
  },
  {
    csvHeader: 'purchase_currency',
    title: 'Currency',
    width: 9,
    valueOf: (line) => line.item?.purchaseCurrency ?? null,
  },
  { csvHeader: 'purchased_at', title: 'Bought on', width: 12, valueOf: (line) => line.item?.purchasedAt ?? null },
  { csvHeader: 'tags', title: 'Tags', width: 20, valueOf: (line) => line.item?.tags.join(TAG_SEPARATOR) ?? '' },
  { csvHeader: 'notes', title: 'Notes', width: 30, valueOf: (line) => line.item?.notes ?? null },
  {
    csvHeader: 'photo_urls',
    title: 'Photos',
    width: 40,
    valueOf: (line) => line.funko.photoUrls.join(PHOTO_URL_SEPARATOR),
  },
];

// RFC 4180: quote a cell when it holds a separator, a quote or a line break; double the quotes inside. Text that
// would run as a formula when the file is opened is defused first.
function toCsvCell(value: CellValue, column: { format?: string }): string {
  if (value === null) return '';

  const isPrice = typeof value === 'number' && column.format === PRICE_FORMAT;
  const raw = isPrice ? value.toFixed(PRICE_DECIMALS) : String(value);
  const isFormula = typeof value === 'string' && FORMULA_START.test(raw) && !PLAIN_NUMBER.test(raw);
  const text = isFormula ? `${FORMULA_ESCAPE}${raw}` : raw;

  if (!NEEDS_QUOTING.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function toCsvLine(line: FunkoExportLine): string {
  return COLUMNS.map((column) => toCsvCell(column.valueOf(line), column)).join(CSV_SEPARATOR);
}

export function toCsv(lines: FunkoExportLine[]): string {
  const header = COLUMNS.map((column) => column.csvHeader).join(CSV_SEPARATOR);
  const rows = lines.map(toCsvLine);

  return [header, ...rows].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}

// A spreadsheet column: its title and width, and a number format for money.
export type SheetColumn = { title: string; width: number; format?: string };

// --- Whole lists -------------------------------------------------------------------------------------------------

// The list's own columns, per kind: what each entry is, read off its summary.
type ListColumn = SheetColumn & { key: string; csvHeader: string };

const NAME_COLUMN: ListColumn = { key: 'name', csvHeader: 'name', title: 'Name', width: 28 };
const ID_COLUMN: ListColumn = { key: 'id', csvHeader: 'id', title: 'Id', width: 7 };
const NOTES_COLUMN: ListColumn = { key: 'notes', csvHeader: 'notes', title: 'Notes', width: 30 };
const FUNKO_COUNT_COLUMN: ListColumn = { key: 'funkoCount', csvHeader: 'funko_count', title: 'Funkos', width: 9 };

export const LIST_COLUMNS: Record<ExportListKind, ListColumn[]> = {
  categories: [ID_COLUMN, NAME_COLUMN, FUNKO_COUNT_COLUMN],
  series: [ID_COLUMN, NAME_COLUMN, FUNKO_COUNT_COLUMN],
  collections: [
    ID_COLUMN,
    NAME_COLUMN,
    { key: 'isDefault', csvHeader: 'is_default', title: 'Default', width: 9 },
    { key: 'itemCount', csvHeader: 'funko_count', title: 'Funkos', width: 9 },
    { key: 'totalQuantity', csvHeader: 'pieces', title: 'Pieces', width: 9 },
    { key: 'totalSpent', csvHeader: 'total_spent', title: 'Total spent', width: 12, format: PRICE_FORMAT },
    NOTES_COLUMN,
  ],
  tags: [ID_COLUMN, NAME_COLUMN, { key: 'itemCount', csvHeader: 'item_count', title: 'Items', width: 9 }, NOTES_COLUMN],
};

function listValue(entry: ListEntry, column: ListColumn): CellValue {
  return entry.summary[column.key] ?? null;
}

export function toListCsv(kind: ExportListKind, entries: ListEntry[]): string {
  const columns = LIST_COLUMNS[kind];
  const header = columns.map((column) => column.csvHeader).join(CSV_SEPARATOR);
  const rows = entries.map((entry) =>
    columns.map((column) => toCsvCell(listValue(entry, column), column)).join(CSV_SEPARATOR),
  );

  return [header, ...rows].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}

// JSON keeps one entry per funko with its items inside, instead of repeating the funko on every line.
export function toFunkoTree(lines: FunkoExportLine[]): FunkoExport[] {
  const byFunko = new Map<number, FunkoExport>();

  for (const line of lines) {
    const entry = byFunko.get(line.funko.id) ?? { ...line.funko, items: [] };

    if (line.item) entry.items.push(line.item);
    byFunko.set(line.funko.id, entry);
  }

  return [...byFunko.values()];
}

// --- Images ------------------------------------------------------------------------------------------------------

type ImageColumn = SheetColumn & { csvHeader: string; valueOf: (image: ImageExport) => CellValue };

export const IMAGE_COLUMNS: ImageColumn[] = [
  { csvHeader: 'funko_id', title: 'Funko id', width: 9, valueOf: (image) => image.funkoId },
  { csvHeader: 'funko_name', title: 'Funko', width: 28, valueOf: (image) => image.funkoName },
  { csvHeader: 'funko_number', title: 'Number', width: 9, valueOf: (image) => image.funkoNumber },
  { csvHeader: 'file_name', title: 'File', width: 40, valueOf: (image) => image.fileName },
  { csvHeader: 'is_main', title: 'Main', width: 7, valueOf: (image) => image.isMain },
  { csvHeader: 'width', title: 'Width', width: 8, valueOf: (image) => image.width },
  { csvHeader: 'height', title: 'Height', width: 8, valueOf: (image) => image.height },
  { csvHeader: 'size_bytes', title: 'Size (bytes)', width: 12, valueOf: (image) => image.sizeBytes },
  { csvHeader: 'uploaded_at', title: 'Uploaded', width: 22, valueOf: (image) => image.uploadedAt },
  { csvHeader: 'url', title: 'Link (large)', width: 50, valueOf: (image) => image.url },
  { csvHeader: 'medium_url', title: 'Link (medium)', width: 50, valueOf: (image) => image.mediumUrl },
  { csvHeader: 'small_url', title: 'Link (small)', width: 50, valueOf: (image) => image.smallUrl },
];

export function toImagesCsv(images: ImageExport[]): string {
  const header = IMAGE_COLUMNS.map((column) => column.csvHeader).join(CSV_SEPARATOR);
  const rows = images.map((image) =>
    IMAGE_COLUMNS.map((column) => toCsvCell(column.valueOf(image), column)).join(CSV_SEPARATOR),
  );

  return [header, ...rows].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}
