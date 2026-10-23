// The .xlsx exports: typed cells, a coloured frozen header with filter arrows, striped rows, chase funkos in gold,
// long text wrapped instead of spilling, one short "Open" link per image, a list's funkos folded under each entry,
// and a funko's images on a sheet of their own.
import writeExcelFile, { type Cell, type Row } from 'write-excel-file/node';
import { COLUMNS, IMAGE_COLUMNS, LIST_COLUMNS, type CellValue, type SheetColumn } from './export.formats.ts';
import type { ListEntry } from './export.lines.ts';
import type { ExportListKind, FunkoExportLine, ImageExport } from './export.schema.ts';
import { organizeSheets, type SheetOrganization } from './export.sheetFeatures.ts';

// A sheet as the Node build of the library takes it.
type Sheet = Parameters<typeof writeExcelFile>[0][number];

const FUNKOS_SHEET_NAME = 'Funkos';
const IMAGES_SHEET_NAME = 'Images';
const HEADER_ROWS = 1;
const FIRST_DATA_ROW = HEADER_ROWS + 1;
const CHASE_COLUMN_HEADER = 'is_chase';
const IMAGES_COLUMN_HEADER = 'image_urls';
// Text that may be long wraps inside its column (taller row) instead of running over the next ones.
const WRAPPED_COLUMN_HEADERS = new Set(['collection', 'name', 'category', 'series', 'exclusive', 'tags', 'notes']);
// One column per image ("Image 1" is the main one), each a short link; a cell holds one link only. As many
// columns as the funko with the most images needs.
const IMAGE_LINK_COLUMN_WIDTH = 9;
const IMAGE_LINK_TEXT = 'Open';
// Row height for wrapped text: Excel does not grow a row by itself when a file is opened, so it is estimated here.
const LINE_HEIGHT_POINTS = 15;
const CHARACTERS_PER_WIDTH_UNIT = 1.1;
const MAX_LINES_PER_ROW = 6;

// The app's teal for the header, a pale teal for group titles, the app's stone for stripes, amber for chase.
const HEADER_STYLE = { fontWeight: 'bold', textColor: '#FFFFFF', backgroundColor: '#0F766E' } as const;
const GROUP_TITLE_STYLE = { fontWeight: 'bold', textColor: '#134E4A', backgroundColor: '#CCFBF1' } as const;
const STRIPE_STYLE = { backgroundColor: '#F5F5F4' } as const;
// A link looks like one: the app's teal, underlined.
const LINK_STYLE = { textColor: '#0F766E', textDecoration: { underline: true } } as const;
const CHASE_STYLE = { backgroundColor: '#FEF3C7', textColor: '#92400E' } as const;
// Every other data row; row numbers are the sheet's own (the header is row 1).
// Formulas are written without the leading "=": the .xlsx format stores them that way (Excel asks to repair a
// file whose formulas start with one; write-excel-file passes the text through as given).
const STRIPE_FORMULA = 'MOD(ROW(),2)=0';

const LIST_SHEET_NAMES: Record<ExportListKind, string> = {
  categories: 'Categories',
  series: 'Series',
  collections: 'Collections',
  tags: 'Tags',
};

// A sheet ready for writeExcelFile, and what the filter / group feature does to it.
type BuiltSheet = { sheet: Sheet; organization: SheetOrganization };

type TableOptions = {
  name: string;
  columns: SheetColumn[];
  rows: Row[];
  // Stripes read badly between group title rows, so a grouped sheet goes without.
  isStriped: boolean;
  // 1-based column of a yes/no "chase" cell: its rows turn gold.
  chaseColumn?: number;
  groups?: SheetOrganization['groups'];
};

// Typed cells: numbers stay numbers (sums work), yes/no stay booleans, text is always text (never a formula).
function toCell(value: CellValue, format: string | undefined): Cell {
  if (value === null) return null;

  return format ? { value, format } : value;
}

// HYPERLINK("url", "text"): our own addresses (APP_ORIGIN + a stored file name), with any quote doubled.
function toLinkCell(url: string, text: string): Cell {
  const quoted = (value: string) => `"${value.replaceAll('"', '""')}"`;

  return { type: 'Formula', value: `HYPERLINK(${quoted(url)},${quoted(text)})`, alignVertical: 'top', ...LINK_STYLE };
}

// How many lines a wrapped cell needs at its column's width, at most MAX_LINES_PER_ROW.
function linesNeeded(value: CellValue, width: number): number {
  if (typeof value !== 'string' || value.length === 0) return 1;

  return Math.min(MAX_LINES_PER_ROW, Math.ceil(value.length / (width * CHARACTERS_PER_WIDTH_UNIT)));
}

// The columns that hold text, then one "Image n" column per image of the funko with the most: the spreadsheet's
// funko columns for these lines.
function sheetFunkoColumns(lines: FunkoExportLine[]): SheetColumn[] {
  const imageColumnCount = Math.max(0, ...lines.map((line) => line.funko.imageUrls.length));
  const textColumns = COLUMNS.filter((column) => column.csvHeader !== IMAGES_COLUMN_HEADER);
  const imageColumns = Array.from({ length: imageColumnCount }, (_, index) => ({
    title: `Image ${index + 1}`,
    width: IMAGE_LINK_COLUMN_WIDTH,
  }));

  return [...textColumns, ...imageColumns];
}

const TEXT_COLUMNS = COLUMNS.filter((column) => column.csvHeader !== IMAGES_COLUMN_HEADER);

// A funko line as sheet cells: everything at the top of its row, long text wrapped (the row grown to fit), then an
// "Open" link per image, up to `imageColumnCount` (blank where this funko has fewer).
function toFunkoRow(line: FunkoExportLine, imageColumnCount: number): Row {
  const lineCount = Math.max(
    ...TEXT_COLUMNS.filter((column) => WRAPPED_COLUMN_HEADERS.has(column.csvHeader)).map((column) =>
      linesNeeded(column.valueOf(line), column.width),
    ),
  );
  const height = lineCount > 1 ? lineCount * LINE_HEIGHT_POINTS : undefined;
  const textCells: Row = TEXT_COLUMNS.map((column, index) => {
    const value = column.valueOf(line);

    if (value === null) return null;

    const wrap = WRAPPED_COLUMN_HEADERS.has(column.csvHeader);
    const rowHeight = index === 0 ? { height } : {};

    return { value, format: column.format, wrap, alignVertical: 'top', ...rowHeight };
  });
  const imageCells: Row = Array.from({ length: imageColumnCount }, (_, index) => {
    const url = line.funko.imageUrls[index];

    return url ? toLinkCell(url, IMAGE_LINK_TEXT) : null;
  });

  return [...textCells, ...imageCells];
}

function imageColumnCountOf(columns: SheetColumn[]): number {
  return columns.length - TEXT_COLUMNS.length;
}

// A table sheet: coloured frozen header with filter arrows, sized columns, optional stripes and chase highlight.
function toTableSheet({ name, columns, rows, isStriped, chaseColumn, groups }: TableOptions): BuiltSheet {
  const header: Row = columns.map((column) => ({ value: column.title, ...HEADER_STYLE }));
  const lastRow = rows.length + HEADER_ROWS;
  const dataRange = {
    from: { row: FIRST_DATA_ROW, column: 1 },
    to: { row: Math.max(lastRow, FIRST_DATA_ROW), column: columns.length },
  };
  const chaseRule = chaseColumn
    ? [
        {
          cellRange: dataRange,
          condition: { formula: `$${columnLetter(chaseColumn)}${FIRST_DATA_ROW}=TRUE` },
          style: CHASE_STYLE,
        },
      ]
    : [];
  const stripeRule = isStriped
    ? [{ cellRange: dataRange, condition: { formula: STRIPE_FORMULA }, style: STRIPE_STYLE }]
    : [];

  return {
    sheet: {
      sheet: name,
      data: [header, ...rows],
      columns: columns.map((column) => ({ width: column.width })),
      stickyRowsCount: HEADER_ROWS,
      // First match wins: a chase row stays gold on a striped line.
      conditionalFormatting: [...chaseRule, ...stripeRule],
    },
    // No filter on a folded sheet: LibreOffice reads rows that are both hidden and inside a filter range as
    // filtered out, and a filtered row cannot be unfolded with "+".
    organization: {
      sheetName: name,
      filter: groups ? undefined : { rowCount: lastRow, columnCount: columns.length },
      groups,
    },
  };
}

// A, B, ... Z, AA: the letter of a 1-based column, for formulas.
function columnLetter(column: number): string {
  let letters = '';
  let remaining = column;

  while (remaining > 0) {
    const index = (remaining - 1) % 26;
    letters = String.fromCharCode(65 + index) + letters;
    remaining = Math.floor((remaining - 1) / 26);
  }

  return letters;
}

const CHASE_COLUMN = TEXT_COLUMNS.findIndex((column) => column.csvHeader === CHASE_COLUMN_HEADER) + 1;

function toFunkosSheet(lines: FunkoExportLine[]): BuiltSheet {
  const columns = sheetFunkoColumns(lines);

  return toTableSheet({
    name: FUNKOS_SHEET_NAME,
    columns,
    rows: lines.map((line) => toFunkoRow(line, imageColumnCountOf(columns))),
    isStriped: true,
    chaseColumn: CHASE_COLUMN,
  });
}

// One entry of a list with its funkos: the entry's own row, then its lines.
export type FunkoGroup = { entry: ListEntry; lines: FunkoExportLine[] };

const NAME_SPAN = 3;

function countLabel(count: unknown, singular: string, plural: string): string {
  const total = typeof count === 'number' ? count : 0;

  return `${total} ${total === 1 ? singular : plural}`;
}

// What an entry's own row says beside its name, read off its summary.
const ENTRY_SUMMARIES: Record<ExportListKind, (summary: ListEntry['summary']) => string> = {
  categories: (summary) => countLabel(summary.funkoCount, 'funko', 'funkos'),
  series: (summary) => countLabel(summary.funkoCount, 'funko', 'funkos'),
  tags: (summary) => countLabel(summary.itemCount, 'item', 'items'),
  collections: (summary) => {
    const spent = typeof summary.totalSpent === 'number' ? summary.totalSpent.toFixed(2) : '0.00';

    return [
      countLabel(summary.itemCount, 'funko', 'funkos'),
      countLabel(summary.totalQuantity, 'piece', 'pieces'),
      `${spent} spent`,
    ].join(' · ');
  },
};

// The entry's row: its name (bold) across the first columns, its totals across the rest.
function toEntryRow(kind: ExportListKind, entry: ListEntry, columnCount: number): Row {
  const restSpan = columnCount - NAME_SPAN;

  return [
    { value: entry.name, columnSpan: NAME_SPAN, ...GROUP_TITLE_STYLE },
    null,
    null,
    { value: ENTRY_SUMMARIES[kind](entry.summary), columnSpan: restSpan, ...GROUP_TITLE_STYLE, fontWeight: undefined },
    ...Array.from({ length: restSpan - 1 }, () => null),
  ];
}

// The whole list on one sheet: a row per entry, each folded shut over its funkos; the "+" beside an entry opens
// them. An entry with no funkos is still listed, with nothing to open.
function toFoldedListSheet(kind: ExportListKind, groups: FunkoGroup[]): BuiltSheet {
  const rows: Row[] = [];
  const memberRows = new Set<number>();
  const titleRows = new Set<number>();
  const columns = sheetFunkoColumns(groups.flatMap((group) => group.lines));

  for (const group of groups) {
    rows.push(toEntryRow(kind, group.entry, columns.length));
    titleRows.add(rows.length + HEADER_ROWS);

    for (const line of group.lines) {
      rows.push(toFunkoRow(line, imageColumnCountOf(columns)));
      memberRows.add(rows.length + HEADER_ROWS);
    }
  }

  return toTableSheet({
    name: LIST_SHEET_NAMES[kind],
    columns,
    rows,
    isStriped: false,
    chaseColumn: CHASE_COLUMN,
    groups: { memberRows, titleRows, isCollapsed: true },
  });
}

async function writeWorkbook(builtSheets: BuiltSheet[], extraSheets: Sheet[] = []): Promise<Buffer> {
  const organizations = builtSheets.map((built) => built.organization);
  const sheets = [...builtSheets.map((built) => built.sheet), ...extraSheets];

  return writeExcelFile(sheets, { features: [organizeSheets(organizations)] }).toBuffer();
}

// --- A funko's images ---------------------------------------------------------------------------------------------

// An image to place on the Images sheet, already JPEG (Excel cannot show WebP).
export type SheetImage = { content: Buffer; width: number; height: number };

const FUNKO_IMAGES_SHEET_NAME = 'Images';
const JPEG_CONTENT_TYPE = 'image/jpeg';
// Each photo is shown this wide, its height kept in proportion, in a row exactly that tall (Excel, Numbers and
// LibreOffice disagree on the default row height, so counting default rows would make photos overlap).
const PHOTO_DISPLAY_WIDTH = 320;
const POINTS_PER_PIXEL = 0.75;
const PHOTO_ROW_PADDING_PX = 12;
const LABEL_COLUMN_WIDTH = 10;
const PHOTO_COLUMN_WIDTH = 50;
const PHOTO_COLUMN = 2;
const SCREEN_DPI = 96;

// One image per row, its number beside it at the top.
function toFunkoImagesSheet(photos: SheetImage[]): Sheet {
  const heights = photos.map((photo) => Math.round((photo.height / photo.width) * PHOTO_DISPLAY_WIDTH));
  const data: Row[] = heights.map((height, index) => [
    {
      value: `Image ${index + 1}`,
      alignVertical: 'top',
      height: Math.ceil((height + PHOTO_ROW_PADDING_PX) * POINTS_PER_PIXEL),
    },
  ]);
  const images = photos.map((photo, index) => ({
    content: photo.content,
    contentType: JPEG_CONTENT_TYPE,
    width: PHOTO_DISPLAY_WIDTH,
    height: heights[index] ?? PHOTO_DISPLAY_WIDTH,
    dpi: SCREEN_DPI,
    anchor: { row: index + 1, column: PHOTO_COLUMN },
  }));

  return {
    sheet: FUNKO_IMAGES_SHEET_NAME,
    data,
    columns: [{ width: LABEL_COLUMN_WIDTH }, { width: PHOTO_COLUMN_WIDTH }],
    images,
  };
}

// --- The downloads ------------------------------------------------------------------------------------------------

// The funkos of a scope; with `photos` (a single funko's images), a second sheet shows them.
export async function toSpreadsheet(lines: FunkoExportLine[], photos: SheetImage[] = []): Promise<Buffer> {
  const photoSheets = photos.length > 0 ? [toFunkoImagesSheet(photos)] : [];

  return writeWorkbook([toFunkosSheet(lines)], photoSheets);
}

// The list as a table; with `groups`, one sheet where each entry folds open onto its funkos.
export async function toListSpreadsheet(
  kind: ExportListKind,
  entries: ListEntry[],
  groups: FunkoGroup[] | null,
): Promise<Buffer> {
  if (groups) return writeWorkbook([toFoldedListSheet(kind, groups)]);

  const columns = LIST_COLUMNS[kind];
  const rows = entries.map((entry) =>
    columns.map((column) => toCell(entry.summary[column.key] ?? null, column.format)),
  );

  return writeWorkbook([toTableSheet({ name: LIST_SHEET_NAMES[kind], columns, rows, isStriped: true })]);
}

const IMAGE_LINK_HEADERS = new Set(['url', 'medium_url', 'small_url']);

// The image columns as the spreadsheet sizes them (a link column only holds "Open").
const SHEET_IMAGE_COLUMNS: SheetColumn[] = IMAGE_COLUMNS.map((column) =>
  IMAGE_LINK_HEADERS.has(column.csvHeader) ? { ...column, width: IMAGE_LINK_COLUMN_WIDTH } : column,
);

// Every image, its three sizes as short "Open" links.
export async function toImagesSpreadsheet(images: ImageExport[]): Promise<Buffer> {
  const rows = images.map((image) =>
    IMAGE_COLUMNS.map((column) => {
      const value = column.valueOf(image);
      const isLink = IMAGE_LINK_HEADERS.has(column.csvHeader) && typeof value === 'string';

      return isLink ? toLinkCell(value, IMAGE_LINK_TEXT) : toCell(value, column.format);
    }),
  );
  const sheet = toTableSheet({ name: IMAGES_SHEET_NAME, columns: SHEET_IMAGE_COLUMNS, rows, isStriped: true });

  return writeWorkbook([sheet]);
}
