import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toCategoryModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/categories/:categoryId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.categories.find((category) => String(category.id) === params.categoryId);

    return row ? HttpResponse.json(toCategoryModel(row)) : notFound('Category', String(params.categoryId));
  }),
];
