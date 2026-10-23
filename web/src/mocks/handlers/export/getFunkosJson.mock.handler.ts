import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound } from '@mocks/mockResponses';
import { attachment, readScopedExport, toFunkoFields, toItemFields } from './funkosExportMockUtils';

type FunkoEntry = ReturnType<typeof toFunkoFields> & { items: ReturnType<typeof toItemFields>[] };

// One entry per funko with its items inside, like the API.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/export/funkos.json`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const scoped = readScopedExport(request.url);

    if (!scoped) return notFound('Export filter', request.url);

    const byFunko = new Map<number, FunkoEntry>();

    for (const { funko, item } of scoped.lines) {
      const entry = byFunko.get(funko.id) ?? { ...toFunkoFields(funko), items: [] };

      if (item) entry.items.push(toItemFields(item));
      byFunko.set(funko.id, entry);
    }

    return HttpResponse.json(
      { exportedAt: new Date().toISOString(), scope: scoped.scope, funkos: [...byFunko.values()] },
      { headers: { 'content-disposition': attachment(`${scoped.fileBase}.json`) } },
    );
  }),
];
