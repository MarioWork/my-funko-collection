import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toItemModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/collections/:collectionId/items/:itemId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.items.find(
      (item) => String(item.id) === params.itemId && String(item.collectionId) === params.collectionId,
    );
    const model = row ? toItemModel(row) : undefined;

    return model ? HttpResponse.json(model) : notFound('Collection item', String(params.itemId));
  }),
];
