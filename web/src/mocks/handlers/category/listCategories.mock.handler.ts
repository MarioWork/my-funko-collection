import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { CategoryApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toCategoryModel } from '@mocks/mockResponses';
import { catalogueCategories } from '@mocks/mockCatalogueUtils';
import { CategoryApiSearchFields, CategoryApiSortingFields } from '@services/categoryService/categoryService';

export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/categories`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<CategoryApiModel>>> => {
      await delay(MOCK_DELAY);

      return HttpResponse.json(
        paginateMockList(request, catalogueCategories().map(toCategoryModel), {
          filters: { [CategoryApiSearchFields.NAME]: (category) => category.name },
          sorts: {
            [CategoryApiSortingFields.NAME]: (category) => category.name,
            [CategoryApiSortingFields.CREATION_DATE]: (category) => category.createdAt,
          },
        }),
      );
    },
  ),
];
