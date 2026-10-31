import { nowIso } from '@mocks/mockStoreUtils';
import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import writeExcelFile from 'write-excel-file/browser';
import { ExportListKindUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import {
  attachment,
  CSV_CONTENT_TYPE,
  CSV_HEADER,
  CSV_LINE_BREAK,
  toCells,
  toCsvLine,
  toFunkoFields,
  toItemFields,
  XLSX_CONTENT_TYPE,
} from './funkosExportMockUtils';
import { readListExport, uniqueLines, type ListExport } from './listExportMockUtils';

function toCsv(listExport: ListExport): string {
  const rows = listExport.includeFunkos
    ? [CSV_HEADER.join(','), ...uniqueLines(listExport).map(({ funko, item }) => toCsvLine(toCells(funko, item)))]
    : [listExport.columns.join(','), ...listExport.entries.map((entry) => toCsvLine(Object.values(entry.summary)))];

  return rows.join(CSV_LINE_BREAK) + CSV_LINE_BREAK;
}

function toJson(kind: ExportListKindUtil, listExport: ListExport) {
  const entries = listExport.entries.map((entry) => {
    if (!listExport.includeFunkos) return entry.summary;

    const funkos = listExport.linesOf(entry).map(({ funko, item }) => ({
      ...toFunkoFields(funko),
      items: item ? [toItemFields(item)] : [],
    }));

    return { ...entry.summary, funkos };
  });

  return { exportedAt: nowIso(), kind, includesFunkos: listExport.includeFunkos, entries };
}

async function toSpreadsheet(listExport: ListExport): Promise<Blob> {
  const bold = (title: string) => ({ value: title, fontWeight: 'bold' as const });
  const listSheet = {
    sheet: 'List',
    data: [listExport.columns.map(bold), ...listExport.entries.map((entry) => Object.values(entry.summary))],
  };
  const funkosSheet = {
    sheet: 'Funkos',
    data: [CSV_HEADER.map(bold), ...uniqueLines(listExport).map(({ funko, item }) => toCells(funko, item))],
  };

  return writeExcelFile(listExport.includeFunkos ? [listSheet, funkosSheet] : [listSheet]).toBlob();
}

// GET /export/<list>.{csv,json,xlsx}: one handler per list and format, like the API's routes.
export default (baseUrl: string) =>
  Object.values(ExportListKindUtil).flatMap((kind) => [
    http.get(`${baseUrl}/export/${kind}.csv`, async ({ request }) => {
      await delay(MOCK_DELAY);

      const listExport = readListExport(kind, request.url);

      return new HttpResponse(toCsv(listExport), {
        headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': attachment(`${listExport.fileBase}.csv`) },
      });
    }),
    http.get(`${baseUrl}/export/${kind}.json`, async ({ request }) => {
      await delay(MOCK_DELAY);

      const listExport = readListExport(kind, request.url);

      return HttpResponse.json(toJson(kind, listExport), {
        headers: { 'content-disposition': attachment(`${listExport.fileBase}.json`) },
      });
    }),
    http.get(`${baseUrl}/export/${kind}.xlsx`, async ({ request }) => {
      await delay(MOCK_DELAY);

      const listExport = readListExport(kind, request.url);

      return new HttpResponse(await toSpreadsheet(listExport), {
        headers: {
          'content-type': XLSX_CONTENT_TYPE,
          'content-disposition': attachment(`${listExport.fileBase}.xlsx`),
        },
      });
    }),
  ]);
