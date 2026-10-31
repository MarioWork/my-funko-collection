import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, DUPLICATE_CONFLICT_MESSAGE, toCategoryModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { nextId, nowIso } from '@mocks/mockStoreUtils';
import type { CreateCategory } from '@services/categoryService/categoryService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/categories`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateCategory;
    const existing = mockStore.categories.find((category) => category.name === body.name);

    if (existing) return conflict(DUPLICATE_CONFLICT_MESSAGE);

    const row = { id: nextId(mockStore.categories), name: body.name, createdAt: nowIso(), updatedAt: nowIso() };

    mockStore.categories.push(row);

    return created(toCategoryModel(row));
  }),
];
