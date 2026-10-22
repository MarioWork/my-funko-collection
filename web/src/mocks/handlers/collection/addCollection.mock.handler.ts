import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, toCollectionModel } from '@mocks/mockResponses';
import { mockStore, nextId, nowIso } from '@mocks/mockStore';
import type { CreateCollection } from '@services/collectionService/collectionService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/collections`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const body = (await request.json()) as CreateCollection;

    if (mockStore.collections.some((collection) => collection.name === body.name)) {
      return conflict('A record with these values already exists');
    }

    if (body.isDefault) for (const collection of mockStore.collections) collection.isDefault = false;

    const row = {
      id: nextId(mockStore.collections),
      name: body.name,
      notes: body.notes ?? null,
      isDefault: body.isDefault ?? false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    mockStore.collections.push(row);

    return HttpResponse.json(toCollectionModel(row), { status: 201 });
  }),
];
