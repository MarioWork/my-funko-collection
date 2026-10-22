import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { notFound, toCollectionModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/collections/:collectionId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.collections.find((collection) => String(collection.id) === params.collectionId);

    return row ? HttpResponse.json(toCollectionModel(row)) : notFound('Collection', String(params.collectionId));
  }),
];
