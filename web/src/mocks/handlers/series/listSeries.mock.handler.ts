import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { SeriesApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toSeriesModel } from '@mocks/mockResponses';
import { catalogueSeries } from '@mocks/mockCatalogueUtils';
import { SeriesApiSearchFields, SeriesApiSortingFields } from '@services/seriesService/seriesService';

export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/series`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<SeriesApiModel>>> => {
      await delay(MOCK_DELAY);

      return HttpResponse.json(
        paginateMockList(request, catalogueSeries().map(toSeriesModel), {
          filters: { [SeriesApiSearchFields.NAME]: (series) => series.name },
          sorts: {
            [SeriesApiSortingFields.NAME]: (series) => series.name,
            [SeriesApiSortingFields.CREATION_DATE]: (series) => series.createdAt,
          },
        }),
      );
    },
  ),
];
