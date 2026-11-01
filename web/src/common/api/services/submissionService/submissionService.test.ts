import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil, SubmissionStatusUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import submissionService, {
  SubmissionApiReviewSearchFields,
  SubmissionApiReviewStates,
  SubmissionApiSearchFields,
  SubmissionApiSortingFields,
} from './submissionService';

type ReceivedRequest = { path: string; body: unknown };

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

describe('getReviewSubmissions', () => {
  it('sends the page and the tab under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/submissions/review`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await submissionService.getReviewSubmissions({
      pagination: { page: '1', size: '100' },
      [SubmissionApiReviewSearchFields.STATE]: SubmissionApiReviewStates.DONE,
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({ page: '1', size: '100', state: 'DONE' });
  });
});

describe('approveSubmission', () => {
  it('posts to the submission’s approval and returns it approved', async () => {
    let receivedPath = '';
    server.use(
      http.post(`${TEST_BASE_API_URL}/submissions/:funkoId/approval`, ({ params }) => {
        receivedPath = String(params.funkoId);

        return HttpResponse.json({ id: 7, status: SubmissionStatusUtil.APPROVED });
      }),
    );

    const result = await submissionService.approveSubmission(7);

    expect(receivedPath).toBe('7');
    expect(result).toMatchObject({ success: true, data: { id: 7, status: SubmissionStatusUtil.APPROVED } });
  });

  it('returns the 409 envelope with the catalogue funko’s id when it clashes', async () => {
    server.use(
      http.post(`${TEST_BASE_API_URL}/submissions/:funkoId/approval`, () =>
        HttpResponse.json({ code: 'CONFLICT', message: 'Taken', existingId: 3 }, { status: 409 }),
      ),
    );

    const result = await submissionService.approveSubmission(7);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, existingId: 3 } });
  });
});

describe('rejectSubmission', () => {
  it('posts the reason to the submission’s rejection', async () => {
    let received: ReceivedRequest | undefined;
    server.use(
      http.post(`${TEST_BASE_API_URL}/submissions/:funkoId/rejection`, async ({ request, params }) => {
        received = { path: String(params.funkoId), body: await request.json() };

        return HttpResponse.json({ id: 7, status: SubmissionStatusUtil.REJECTED });
      }),
    );

    const result = await submissionService.rejectSubmission(7, { reason: 'Blurry photo' });

    expect(received).toEqual({ path: '7', body: { reason: 'Blurry photo' } });
    expect(result.success).toBe(true);
  });
});

describe('resendSubmission', () => {
  it('posts to the submission’s resubmission and returns it waiting', async () => {
    let receivedPath = '';
    server.use(
      http.post(`${TEST_BASE_API_URL}/submissions/:funkoId/resubmission`, ({ params }) => {
        receivedPath = String(params.funkoId);

        return HttpResponse.json({ id: 7, status: SubmissionStatusUtil.WAITING });
      }),
    );

    const result = await submissionService.resendSubmission(7);

    expect(receivedPath).toBe('7');
    expect(result).toMatchObject({ success: true, data: { status: SubmissionStatusUtil.WAITING } });
  });
});
