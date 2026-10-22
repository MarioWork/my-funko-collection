import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, notFound, toCollectionModel } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import type { UpdateCollection } from '@services/collectionService/collectionService.type';

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/collections/:collectionId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = mockStore.collections.find((collection) => String(collection.id) === params.collectionId);

    if (!row) return notFound('Collection', String(params.collectionId));

    const body = (await request.json()) as UpdateCollection;

    if (row.isDefault && body.isDefault === false) {
      return conflict('Set another collection as default instead of unsetting this one');
    }

    if (body.isDefault) for (const collection of mockStore.collections) collection.isDefault = false;

    Object.assign(row, body, { updatedAt: nowIso() });

    return HttpResponse.json(toCollectionModel(row));
  }),
];
