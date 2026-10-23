import { http, HttpResponse } from 'msw/http';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import suggestService, { SUGGEST_QUERY_PARAM } from './suggestService';

it('sends the query under q', async () => {
  let receivedQuery = '';
  server.use(
    http.get(`${TEST_BASE_API_URL}/suggest`, ({ request }) => {
      receivedQuery = new URL(request.url).searchParams.get(SUGGEST_QUERY_PARAM) ?? '';

      return HttpResponse.json({ funkos: [], categories: [], collections: [], tags: [] });
    }),
  );

  await suggestService.getSuggestions('mar');

  expect(receivedQuery).toBe('mar');
});

it('groups funkos, categories, collections and tags from the mock store', async () => {
  const result = await suggestService.getSuggestions('mar');

  expect(result.funkos.map((funko) => funko.name)).toContain('Mario');
  expect(result.categories.map((category) => category.name)).toEqual(['Pop! Marvel']);
});
