import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { SuggestApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { filterFunkos } from '@mocks/handlers/funko/funkoSearchUtils';
import { toFunkoSummary } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { SUGGEST_QUERY_PARAM } from '@services/suggestService/suggestService';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';

const FUNKO_LIMIT = 5;

// Exact name, then name prefix, then the rest: the API's relevance order.
function relevance(name: string, wanted: string): number {
  const lowered = name.toLowerCase();

  if (lowered === wanted) return 0;
  if (lowered.startsWith(wanted)) return 1;

  return 2;
}
const OTHER_LIMIT = 3;

export default (baseUrl: string) => [
  http.get(`${baseUrl}/suggest`, async ({ request }): Promise<HttpResponse<SuggestApiModel>> => {
    await delay(MOCK_DELAY);

    const query = new URL(request.url).searchParams.get(SUGGEST_QUERY_PARAM) ?? '';
    const lowered = query.toLowerCase();
    const byName = (rows: { id: number; name: string }[]) =>
      rows
        .filter((row) => row.name.toLowerCase().includes(lowered))
        .slice(0, OTHER_LIMIT)
        .map(({ id, name }) => ({ id, name }));
    const funkoParams = new URLSearchParams({ [FunkoApiSearchFields.QUERY]: query });

    return HttpResponse.json({
      funkos: filterFunkos(funkoParams)
        .sort((a, b) => relevance(a.name, lowered) - relevance(b.name, lowered) || a.name.localeCompare(b.name))
        .slice(0, FUNKO_LIMIT)
        .map(toFunkoSummary),
      categories: byName(mockStore.categories),
      collections: byName(mockStore.collections),
      tags: byName(mockStore.tags),
    });
  }),
];
