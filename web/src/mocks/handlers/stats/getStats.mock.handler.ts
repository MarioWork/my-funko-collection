import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { StatsApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { toCollectionModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

// Like the API: the signed-in user's collections, and the funkos in them (with their categories and images), not the
// whole catalogue. Every collection in the mock store is the signed-in user's.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/stats`, async (): Promise<HttpResponse<StatsApiModel>> => {
    await delay(MOCK_DELAY);

    const ownFunkoIds = new Set(mockStore.items.map((item) => item.funkoId));
    const ownFunkos = mockStore.funkos.filter((funko) => ownFunkoIds.has(funko.id));
    const ownImages = mockStore.images.filter((image) => ownFunkoIds.has(image.funkoId));
    const ownCategories = mockStore.categories.filter((category) =>
      ownFunkos.some((funko) => funko.categoryId === category.id),
    );

    return HttpResponse.json({
      funkoCount: ownFunkos.length,
      categoryCount: ownCategories.length,
      tagCount: mockStore.tags.length,
      imageCount: ownImages.length,
      imageBytes: ownImages.reduce((sum, image) => sum + image.sizeBytes, 0),
      collections: [...mockStore.collections]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((row) => {
          const { id, name, isDefault, itemCount, totalQuantity, totalSpentCents } = toCollectionModel(row);

          return { id, name, isDefault, itemCount, totalQuantity, totalSpentCents };
        }),
      byCategory: [...ownCategories]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((category) => ({
          id: category.id,
          name: category.name,
          funkoCount: ownFunkos.filter((funko) => funko.categoryId === category.id).length,
        })),
    });
  }),
];
