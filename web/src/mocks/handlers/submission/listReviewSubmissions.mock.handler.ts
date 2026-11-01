import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ReviewSubmissionApiModel } from '@app-types/models';
import { SubmissionStatusUtil, type ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { pageMockList } from '@mocks/mockListUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow } from '@mocks/mockStore.type';
import {
  DEFAULT_REVIEW_STATE,
  SubmissionApiReviewSearchFields,
  SubmissionApiReviewStates,
} from '@services/submissionService/submissionService';
import { toReviewSubmissionModel } from './submissionMockUtils';

type ReviewTab = {
  isIn: (row: MockFunkoRow) => boolean;
  compare: (first: MockFunkoRow, second: MockFunkoRow) => number;
};

// As the API's tabs: the waiting ones oldest first, the reviewed ones last reviewed first.
const REVIEW_TAB_MAP: Record<SubmissionApiReviewStates, ReviewTab> = {
  [SubmissionApiReviewStates.WAITING]: {
    isIn: (row) => row.status === SubmissionStatusUtil.WAITING,
    compare: (first, second) => first.createdAt.localeCompare(second.createdAt) || first.id - second.id,
  },
  [SubmissionApiReviewStates.DONE]: {
    isIn: (row) => row.status !== SubmissionStatusUtil.WAITING && row.reviewedAt !== null,
    compare: (first, second) => (second.reviewedAt ?? '').localeCompare(first.reviewedAt ?? '') || second.id - first.id,
  },
};

function reviewStateOf(params: URLSearchParams): SubmissionApiReviewStates {
  const state = params.get(SubmissionApiReviewSearchFields.STATE);
  const isKnown = state === SubmissionApiReviewStates.WAITING || state === SubmissionApiReviewStates.DONE;

  return isKnown ? state : DEFAULT_REVIEW_STATE;
}

// Every member's submissions for the admins, like the API's GET /submissions/review (members get 403 from
// requireAdmin first).
export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/submissions/review`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<ReviewSubmissionApiModel>>> => {
      await delay(MOCK_DELAY);

      const params = new URL(request.url).searchParams;
      const { isIn, compare } = REVIEW_TAB_MAP[reviewStateOf(params)];
      const rows = mockStore.funkos.filter(isIn).sort(compare).map(toReviewSubmissionModel);

      return HttpResponse.json(pageMockList(params, rows));
    },
  ),
];
