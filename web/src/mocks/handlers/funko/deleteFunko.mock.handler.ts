import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { forgetNotifiedFunkos } from '@mocks/handlers/notification/notificationMockUtils';
import { isTrueParam } from '@mocks/mockListUtils';
import { conflict, noContent } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { FORCE_PARAM } from '@services/funkoService/funkoService';
import { findEditableFunko } from './funkoMockUtils';

// An admin deletes any funko; a member only their own waiting submission.
export default (baseUrl: string) => [
  http.delete(`${baseUrl}/funkos/:funkoId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const target = findEditableFunko(String(params.funkoId));

    if ('refusal' in target) return target.refusal;

    const row = target.funko;

    const isForced = isTrueParam(new URL(request.url).searchParams.get(FORCE_PARAM));
    const memberships = mockStore.items.filter((item) => item.funkoId === row.id);

    if (memberships.length > 0 && !isForced) {
      const names = [
        ...new Set(
          memberships.map(
            (item) => mockStore.collections.find((collection) => collection.id === item.collectionId)?.name,
          ),
        ),
      ]
        .map((name) => `"${name}"`)
        .join(', ');

      return conflict(`The funko is in ${names}. Send force=true to remove it from them and delete it`);
    }

    mockStore.items = mockStore.items.filter((item) => item.funkoId !== row.id);
    mockStore.images = mockStore.images.filter((image) => image.funkoId !== row.id);
    mockStore.funkos.splice(mockStore.funkos.indexOf(row), 1);
    forgetNotifiedFunkos(new Set([row.id]));

    return noContent();
  }),
];
