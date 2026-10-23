import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ImageListEntryApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { ImageApiSearchFields, ImageApiSortingFields } from '@services/imageService/imageService';
import { allImageEntries, imageDisplayName } from './imageMockUtils';

export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/images`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<ImageListEntryApiModel>>> => {
      await delay(MOCK_DELAY);

      const entries = allImageEntries();

      return HttpResponse.json(
        paginateMockList(request, entries, {
          filters: {
            [ImageApiSearchFields.QUERY]: (entry) => `${entry.funko?.name ?? ''} ${entry.fileName}`,
            [ImageApiSearchFields.HAS_FUNKO]: (entry) => entry.funko !== null,
          },
          sorts: {
            [ImageApiSortingFields.CREATION_DATE]: (entry) => entry.createdAt,
            [ImageApiSortingFields.SIZE]: (entry) => entry.sizeBytes,
            [ImageApiSortingFields.NAME]: (entry) => imageDisplayName(entry).toLowerCase(),
          },
        }),
      );
    },
  ),
];
