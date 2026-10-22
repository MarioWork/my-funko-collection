import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { CollectionApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toCollectionModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { CollectionApiSearchFields, CollectionApiSortingFields } from '@services/collectionService/collectionService';

export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/collections`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<CollectionApiModel>>> => {
      await delay(MOCK_DELAY);

      return HttpResponse.json(
        paginateMockList(request, mockStore.collections.map(toCollectionModel), {
          filters: { [CollectionApiSearchFields.NAME]: (collection) => collection.name },
          sorts: {
            [CollectionApiSortingFields.NAME]: (collection) => collection.name,
            [CollectionApiSortingFields.CREATION_DATE]: (collection) => collection.createdAt,
          },
        }),
      );
    },
  ),
];
