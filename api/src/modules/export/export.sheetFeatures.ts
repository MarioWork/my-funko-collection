// Two spreadsheet features write-excel-file leaves to its users ("features": raw access to the .xlsx XML):
// filter arrows on a sheet's header row, and rows grouped under a title row that can be folded (+/−).
import type writeExcelFile from 'write-excel-file/node';
import {
  appendMarkupInsideElement,
  findElement,
  getCellAddress,
  getClosingTagMarkup,
  getOpeningTagMarkup,
  getOrderOfSiblings,
  getSelfClosingTagMarkup,
  insertElementMarkupAccordingToOrderOfSiblings,
  replaceElement,
  sanitizeTextContent,
} from 'write-excel-file/utility';

// The library's Feature type, with the Node build's own file-content type filled in.
type NodeFeature = NonNullable<NonNullable<Parameters<typeof writeExcelFile>[1]>['features']>[number];

const WORKSHEET_FILE = 'xl/worksheets/sheet{id}.xml';
const WORKBOOK_FILE = 'xl/workbook.xml';
const ROW_TAG = 'row';
const OUTLINE_LEVEL = 1;
// Excel's default row height in points; `sheetFormatPr` needs one to carry the outline level.
const DEFAULT_ROW_HEIGHT = 15;
// Excel names a sheet's filter range with this hidden defined name; LibreOffice needs it to show the arrows.
const FILTER_DATABASE_NAME = '_xlnm._FilterDatabase';

// What one sheet gets, by its position in the workbook.
export type SheetOrganization = {
  sheetName: string;
  // Filter arrows over the header and every row below it.
  filter?: { rowCount: number; columnCount: number };
  // Rows folded under a title row just above them (1-based row numbers). `isCollapsed` starts every group shut:
  // its rows hidden and the title showing "+".
  groups?: { memberRows: Set<number>; titleRows: Set<number>; isCollapsed: boolean };
};

function filterRef(filter: NonNullable<SheetOrganization['filter']>): string {
  return `${getCellAddress(0, 0)}:${getCellAddress(filter.rowCount - 1, filter.columnCount - 1)}`;
}

function absoluteRef(sheetName: string, filter: NonNullable<SheetOrganization['filter']>): string {
  const [from, to] = filterRef(filter).split(':');
  const absolute = (address: string | undefined) => (address ?? '').replace(/^([A-Z]+)(\d+)$/, '$$$1$$$2');
  const quotedName = `'${sheetName.replaceAll("'", "''")}'`;

  return `${quotedName}!${absolute(from)}:${absolute(to)}`;
}

// A member row gets the outline level (and is hidden when the groups start shut); a title row is marked collapsed
// so the spreadsheet shows "+" beside it.
function groupRowAttributes(
  groups: NonNullable<SheetOrganization['groups']>,
  rowNumber: number,
): Record<string, number> {
  if (groups.memberRows.has(rowNumber)) {
    return groups.isCollapsed ? { outlineLevel: OUTLINE_LEVEL, hidden: 1 } : { outlineLevel: OUTLINE_LEVEL };
  }

  if (groups.isCollapsed && groups.titleRows.has(rowNumber)) return { collapsed: 1 };

  return {};
}

function insertIntoWorksheet(xml: string, markup: string): string {
  const order = getOrderOfSiblings(WORKSHEET_FILE, 'worksheet') ?? [];

  return insertElementMarkupAccordingToOrderOfSiblings(xml, markup, order, 'worksheet');
}

// The +/− sits on the title row above each group (summaryBelow="0"), and the sheet declares one outline level.
function addOutlineProperties(xml: string): string {
  let result = xml;

  if (!findElement(result, 'sheetPr')) {
    const outline = getSelfClosingTagMarkup('outlinePr', { summaryBelow: 0 });
    result = insertIntoWorksheet(
      result,
      `${getOpeningTagMarkup('sheetPr')}${outline}${getClosingTagMarkup('sheetPr')}`,
    );
  }

  if (!findElement(result, 'sheetFormatPr')) {
    const formatMarkup = getSelfClosingTagMarkup('sheetFormatPr', {
      defaultRowHeight: DEFAULT_ROW_HEIGHT,
      outlineLevelRow: OUTLINE_LEVEL,
    });
    result = insertIntoWorksheet(result, formatMarkup);
  }

  return result;
}

function definedNameElements(sheets: SheetOrganization[]): string {
  const names = sheets.flatMap((sheet, sheetIndex) => {
    if (!sheet.filter) return [];

    const attributes = { name: FILTER_DATABASE_NAME, localSheetId: sheetIndex, hidden: 1 };
    const reference = sanitizeTextContent(absoluteRef(sheet.sheetName, sheet.filter));

    return [`${getOpeningTagMarkup('definedName', attributes)}${reference}${getClosingTagMarkup('definedName')}`];
  });

  return names.join('');
}

function definedNamesMarkup(sheets: SheetOrganization[]): string {
  const names = definedNameElements(sheets);

  if (!names) return '';

  return `${getOpeningTagMarkup('definedNames')}${names}${getClosingTagMarkup('definedNames')}`;
}

// One feature for the whole workbook: `sheets` is in the same order as the sheets passed to writeExcelFile.
export function organizeSheets(sheets: SheetOrganization[]): NodeFeature {
  return {
    files: {
      transform: {
        [WORKSHEET_FILE]: {
          transformElementAttributes: (tagName, attributes, index, _options, { sheetIndex }) => {
            const groups = sheets[sheetIndex]?.groups;

            if (tagName !== ROW_TAG || !groups) return attributes;

            return { ...attributes, ...groupRowAttributes(groups, (index ?? -1) + 1) };
          },
          transform: (xml, _options, { sheetIndex }) => {
            const sheet = sheets[sheetIndex];
            let result = xml;

            if (sheet?.filter) {
              result = insertIntoWorksheet(
                result,
                getSelfClosingTagMarkup('autoFilter', { ref: filterRef(sheet.filter) }),
              );
            }

            if (sheet?.groups && sheet.groups.memberRows.size > 0) result = addOutlineProperties(result);

            return result;
          },
        },
        [WORKBOOK_FILE]: {
          transform: (xml) => {
            const markup = definedNamesMarkup(sheets);

            if (!markup) return xml;

            // The library writes an empty <definedNames/>: fill it rather than add a second one.
            const existing = findElement(xml, 'definedNames');

            if (existing?.selfClosingTag) return replaceElement(xml, existing, markup);

            if (existing) return appendMarkupInsideElement(xml, existing, definedNameElements(sheets));

            return insertElementMarkupAccordingToOrderOfSiblings(
              xml,
              markup,
              getOrderOfSiblings(WORKBOOK_FILE, 'workbook') ?? [],
              'workbook',
            );
          },
        },
      },
    },
  };
}
