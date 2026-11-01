import { useRouteLoaderData } from 'react-router';
import type { FunkoId, ReviewSubmissionApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { SUBMISSION_REVIEW_ROUTE_ID } from '@application/routes/routesUtils';
import type { loader } from '../../../submissionReviewLoader';

// The submission as the review list behind the dialog holds it, with its maybe-doubles: no second request. Undefined
// once it left the Waiting list (merged a moment ago, or a stale link); the dialog then lists no maybe-doubles.
export function useReviewedSubmission(funkoId: FunkoId): ReviewSubmissionApiModel | undefined {
  const listData = useRouteLoaderData<LoaderDataUtil<typeof loader>>(SUBMISSION_REVIEW_ROUTE_ID);

  return listData?.submissionsResponse.data.find((submission) => submission.id === funkoId);
}
