import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/categories/:categoryId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.categories.findIndex((category) => String(category.id) === params.categoryId);

    if (index === -1) return notFound('Category', String(params.categoryId));

    const isInUse = mockStore.funkos.some((funko) => String(funko.categoryId) === params.categoryId);

    if (isInUse) return conflict('The record is still referenced by another one');

    mockStore.categories.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
