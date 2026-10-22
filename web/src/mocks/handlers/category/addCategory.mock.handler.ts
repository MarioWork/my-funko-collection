import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, toCategoryModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso } from '@mocks/mockStore';
import type { CreateCategory } from '@services/categoryService/categoryService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/categories`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateCategory;
    const existing = mockStore.categories.find((category) => category.name === body.name);

    if (existing) return conflict('A record with these values already exists');

    const row = { id: nextId(mockStore.categories), name: body.name, createdAt: nowIso(), updatedAt: nowIso() };

    mockStore.categories.push(row);

    return HttpResponse.json(toCategoryModel(row), { status: 201 });
  }),
];
