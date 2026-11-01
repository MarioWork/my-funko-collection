import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { useListParams } from '@hooks/useListParams';
import {
  SubmissionApiReviewSearchFields,
  type SubmissionApiReviewStates,
} from '@services/submissionService/submissionService';
import type { loader } from '../submissionReviewLoader';

// The review page's data and its open tab, which lives in the URL (the loader reads it).
export function useSubmissionReview() {
  const { submissionsResponse, state } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { setParams } = useListParams();

  const setState = (next: SubmissionApiReviewStates) => setParams({ [SubmissionApiReviewSearchFields.STATE]: next });

  return {
    submissions: submissionsResponse.data,
    totalResultNumber: submissionsResponse.totalResultNumber,
    state,
    setState,
  };
}
