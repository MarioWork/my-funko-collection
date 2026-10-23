import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import writeExcelFile from 'write-excel-file/browser';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound } from '@mocks/mockResponses';
import { attachment, CSV_HEADER, readScopedExport, toCells, XLSX_CONTENT_TYPE } from './funkosExportMockUtils';

// A real .xlsx in the demo too, built in the browser: a bold header row, then one row per line.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/export/funkos.xlsx`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const scoped = readScopedExport(request.url);

    if (!scoped) return notFound('Export filter', request.url);

    const header = CSV_HEADER.map((title) => ({ value: title, fontWeight: 'bold' as const }));
    const rows = scoped.lines.map(({ funko, item }) => toCells(funko, item));
    const blob = await writeExcelFile([header, ...rows]).toBlob();

    return new HttpResponse(blob, {
      headers: { 'content-type': XLSX_CONTENT_TYPE, 'content-disposition': attachment(`${scoped.fileBase}.xlsx`) },
    });
  }),
];
