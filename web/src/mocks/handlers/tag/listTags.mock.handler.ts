import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { TagApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { paginateMockList } from '@mocks/mockListUtils';
import { toTagModel } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import { TagApiSearchFields, TagApiSortingFields } from '@services/tagService/tagService';

export default (baseUrl: string) => [
  http.get(`${baseUrl}/tags`, async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<TagApiModel>>> => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(
      paginateMockList(request, mockStore.tags.map(toTagModel), {
        filters: { [TagApiSearchFields.NAME]: (tag) => tag.name },
        sorts: {
          [TagApiSortingFields.NAME]: (tag) => tag.name,
          [TagApiSortingFields.CREATION_DATE]: (tag) => tag.createdAt,
        },
      }),
    );
  }),
];
