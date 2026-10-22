import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, notFound } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.delete(`${baseUrl}/funkos/:funkoId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.funkos.findIndex((funko) => String(funko.id) === params.funkoId);
    const row = mockStore.funkos[index];

    if (!row) return notFound('Funko', String(params.funkoId));

    const isForced = new URL(request.url).searchParams.get('force') === 'true';
    const memberships = mockStore.items.filter((item) => item.funkoId === row.id);

    if (memberships.length > 0 && !isForced) {
      const names = [
        ...new Set(memberships.map((item) => mockStore.collections.find((c) => c.id === item.collectionId)?.name)),
      ]
        .map((name) => `"${name}"`)
        .join(', ');

      return conflict(`The funko is in ${names}. Send force=true to remove it from them and delete it`);
    }

    mockStore.items = mockStore.items.filter((item) => item.funkoId !== row.id);
    mockStore.images = mockStore.images.filter((image) => image.funkoId !== row.id);
    mockStore.funkos.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
