import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound } from '@mocks/mockResponses';
import {
  attachment,
  CSV_CONTENT_TYPE,
  CSV_HEADER,
  readScopedExport,
  toCells,
  toCsvLine,
} from './funkosExportMockUtils';

const CSV_LINE_BREAK = '\r\n';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/export/funkos.csv`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const scoped = readScopedExport(request.url);

    if (!scoped) return notFound('Export filter', request.url);

    const rows = scoped.lines.map(({ funko, item }) => toCsvLine(toCells(funko, item)));
    const csv = [CSV_HEADER.join(','), ...rows].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;

    return new HttpResponse(csv, {
      headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': attachment(`${scoped.fileBase}.csv`) },
    });
  }),
];
