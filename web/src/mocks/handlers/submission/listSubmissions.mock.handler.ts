import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { SubmissionApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { isSubmittedByMockUser } from '@mocks/mockCatalogueUtils';
import { paginateMockList } from '@mocks/mockListUtils';
import { toFunkoSummary } from '@mocks/mockResponses';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';
import { SubmissionApiSearchFields, SubmissionApiSortingFields } from '@services/submissionService/submissionService';

function toSubmissionModel(row: MockFunkoRow): SubmissionApiModel {
  return { ...toFunkoSummary(row), status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

// What the signed-in user sent in, whatever became of it, like the API's GET /submissions.
export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/submissions`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<SubmissionApiModel>>> => {
      await delay(MOCK_DELAY);

      const submissions = mockStore.funkos.filter(isSubmittedByMockUser).map(toSubmissionModel);

      return HttpResponse.json(
        paginateMockList(request, submissions, {
          filters: { [SubmissionApiSearchFields.STATUS]: (submission) => submission.status },
          sorts: {
            [SubmissionApiSortingFields.NAME]: (submission) => submission.name,
            [SubmissionApiSortingFields.CREATION_DATE]: (submission) => submission.createdAt,
          },
        }),
      );
    },
  ),
];
