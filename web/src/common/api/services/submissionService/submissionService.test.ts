import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil, SubmissionStatusUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import submissionService, { SubmissionApiSearchFields, SubmissionApiSortingFields } from './submissionService';

describe('getSubmissions', () => {
  it('sends the page, the sort and the status under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/submissions`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await submissionService.getSubmissions({
      pagination: { page: '2', size: '20' },
      sortingField: SubmissionApiSortingFields.CREATION_DATE,
      direction: SortingDirectionUtil.DESC,
      [SubmissionApiSearchFields.STATUS]: SubmissionStatusUtil.WAITING,
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '2',
      size: '20',
      sorting_fields: 'CREATION_DATE',
      direction: 'DESC',
      status: 'WAITING',
    });
  });
});
