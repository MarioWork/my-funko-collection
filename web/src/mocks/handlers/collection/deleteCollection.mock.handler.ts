import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/collections/:collectionId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.collections.findIndex((collection) => String(collection.id) === params.collectionId);
    const row = mockStore.collections[index];

    if (!row) return notFound('Collection', String(params.collectionId));
    if (row.isDefault) return conflict('The default collection cannot be deleted');

    mockStore.collections.splice(index, 1);
    mockStore.items = mockStore.items.filter((item) => item.collectionId !== row.id);

    return new HttpResponse(null, { status: 204 });
  }),
];
