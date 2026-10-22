import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toCategoryModel } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import type { UpdateCategory } from '@services/categoryService/categoryService.type';

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/categories/:categoryId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.categories.find((category) => String(category.id) === params.categoryId);

    if (!row) return notFound('Category', String(params.categoryId));

    const body = (await request.json()) as UpdateCategory;

    Object.assign(row, body, { updatedAt: nowIso() });

    return HttpResponse.json(toCategoryModel(row));
  }),
];
