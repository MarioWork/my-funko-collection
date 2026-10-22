import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { StatsApiModel } from '@app-types/models';
import { MOCK_DELAY } from '@mocks/handlers';
import { toCollectionModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/stats`, async (): Promise<HttpResponse<StatsApiModel>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json({
      funkoCount: mockStore.funkos.length,
      categoryCount: mockStore.categories.length,
      tagCount: mockStore.tags.length,
      imageCount: mockStore.images.length,
      imageBytes: mockStore.images.reduce((sum, image) => sum + image.sizeBytes, 0),
      collections: [...mockStore.collections]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((row) => {
          const { id, name, isDefault, itemCount, totalQuantity, totalSpentCents } = toCollectionModel(row);

          return { id, name, isDefault, itemCount, totalQuantity, totalSpentCents };
        }),
      byCategory: [...mockStore.categories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((category) => ({
          id: category.id,
          name: category.name,
          funkoCount: mockStore.funkos.filter((funko) => funko.categoryId === category.id).length,
        })),
    });
  }),
];
