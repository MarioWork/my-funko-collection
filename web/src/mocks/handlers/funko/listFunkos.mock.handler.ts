import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { FunkoApiModel } from '@app-types/models';
import { ApiUrlParamsUtil, SortingDirectionUtil, type ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toFunkoModel } from '@mocks/mockResponses';
import { FunkoApiSearchFields, FunkoApiSortingFields } from '@services/funkoService/funkoService';
import { filterFunkos, matchedFields, relevance, splitWords } from './funkoSearchUtils';

// Zero-padded, so number 78 sorts before 1203 when compared as text.
const NUMBER_SORT_WIDTH = 6;

export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/funkos`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<FunkoApiModel>>> => {
      await delay(MOCK_DELAY);

      const params = new URL(request.url).searchParams;
      const query = params.get(FunkoApiSearchFields.QUERY) ?? '';
      const words = splitWords(query);
      const hasSearch = words.length > 0;
      const rows = filterFunkos(params).map((row) => ({
        ...toFunkoModel(row),
        matchedOn: hasSearch ? matchedFields(row, words) : undefined,
      }));

      // Default sort: relevance when searching, name otherwise; the number breaks ties.
      const hasSortParam = params.has(ApiUrlParamsUtil.sorting_fields);
      const sortedUrl = new URL(request.url);

      if (!hasSortParam) {
        sortedUrl.searchParams.set(
          ApiUrlParamsUtil.sorting_fields,
          hasSearch ? FunkoApiSortingFields.RELEVANCE : FunkoApiSortingFields.NAME,
        );
        sortedUrl.searchParams.set(ApiUrlParamsUtil.sortingDirection, SortingDirectionUtil.ASC);
      }

      return HttpResponse.json(
        paginateMockList(new Request(sortedUrl), rows, {
          sorts: {
            [FunkoApiSortingFields.RELEVANCE]: (funko) => relevance(funko.name, query),
            [FunkoApiSortingFields.NAME]: (funko) => `${funko.name} ${funko.number.padStart(NUMBER_SORT_WIDTH, '0')}`,
            [FunkoApiSortingFields.NUMBER]: (funko) => Number.parseInt(funko.number, 10) || 0,
            [FunkoApiSortingFields.CREATION_DATE]: (funko) => funko.createdAt,
            [FunkoApiSortingFields.CATEGORY]: (funko) =>
              `${funko.category.name} ${funko.number.padStart(NUMBER_SORT_WIDTH, '0')}`,
            [FunkoApiSortingFields.SERIES]: (funko) => funko.series.name,
          },
        }),
      );
    },
  ),
];
