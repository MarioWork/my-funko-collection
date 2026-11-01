import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import submissionService, {
  DEFAULT_REVIEW_STATE,
  SubmissionApiReviewSearchFields,
} from '@services/submissionService/submissionService';
import { assertAdmin } from '@utils/adminRouteUtils';
import { isReviewState, REVIEW_PAGE_SIZE } from './submissionReviewUtils';

// Admins only. The open tab (Waiting or Done) is in the URL, so a reload or a shared link keeps it.
export async function loader({ request, context }: LoaderFunctionArgs) {
  assertAdmin(context);

  const stateParam = new URL(request.url).searchParams.get(SubmissionApiReviewSearchFields.STATE) ?? undefined;
  const state = isReviewState(stateParam) ? stateParam : DEFAULT_REVIEW_STATE;
  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: REVIEW_PAGE_SIZE },
    [SubmissionApiReviewSearchFields.STATE]: state,
  };

  const submissionsResponse = await submissionService.getReviewSubmissions(fields);

  return { submissionsResponse, state };
}
