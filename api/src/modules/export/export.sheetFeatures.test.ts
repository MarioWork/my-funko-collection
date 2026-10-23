import { organizeSheets } from './export.sheetFeatures.ts';

const SHEET_XML =
  '<worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols/><sheetData><row r="1"/></sheetData></worksheet>';
const WORKBOOK_XML = '<workbook><sheets><sheet name="Funkos"/></sheets><definedNames/><calcPr/></workbook>';
const SHEET_PROPERTIES = { sheetIndex: 0, sheetId: '1' };

const feature = organizeSheets([
  {
    sheetName: "Bob's Funkos",
    filter: { rowCount: 8, columnCount: 18 },
    groups: { memberRows: new Set([3, 4]), titleRows: new Set([2]), isCollapsed: true },
  },
]);
const sheetTransform = feature.files?.transform?.['xl/worksheets/sheet{id}.xml'];
const workbookTransform = feature.files?.transform?.['xl/workbook.xml'];

describe('organizeSheets', () => {
  it('hides the rows inside a group and marks its title collapsed when the groups start shut', () => {
    const transform = sheetTransform?.transformElementAttributes;
    const rowAt = (index: number) => transform?.('row', { r: index + 1 }, index, {}, SHEET_PROPERTIES);

    expect(rowAt(2)).toEqual({ r: 3, outlineLevel: 1, hidden: 1 });
    expect(rowAt(1)).toEqual({ r: 2, collapsed: 1 });
    expect(rowAt(0)).toEqual({ r: 1 });
    expect(transform?.('c', { r: 'A3' }, 2, {}, SHEET_PROPERTIES)).toEqual({ r: 'A3' });
  });

  it('adds the filter after the data, and the outline settings at the top, when the sheet is filtered and grouped', () => {
    const xml = sheetTransform?.transform?.(SHEET_XML, {}, SHEET_PROPERTIES) ?? '';

    expect(xml).toContain('</sheetData><autoFilter ref="A1:R8"/>');
    expect(xml.indexOf('<sheetPr><outlinePr summaryBelow="0"/></sheetPr>')).toBe('<worksheet>'.length);
    expect(xml).toContain('outlineLevelRow="1"');
  });

  it('names the filter range for each filtered sheet, quoting the sheet name, when the workbook has an empty list', () => {
    const xml = workbookTransform?.transform?.(WORKBOOK_XML, [], {}) ?? '';

    expect(xml).toContain(
      `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Bob''s Funkos'!$A$1:$R$8</definedName></definedNames>`,
    );
    expect(xml).not.toContain('<definedNames/>');
  });
});
