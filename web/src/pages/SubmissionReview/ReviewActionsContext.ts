import { createContext } from 'react';
import type { ApiError, ReviewSubmissionApiModel, SubmissionId } from '@app-types/models';

// The Waiting list's approve, reject and merge, from useReviewActions, shared with each row's buttons through context so
// the list does not pass them down every level.
export type ReviewActionsContextValue = {
  busyId: SubmissionId | undefined;
  isBusy: boolean;
  approve: (submission: ReviewSubmissionApiModel) => void;
  openReject: (submission: ReviewSubmissionApiModel) => void;
  openMerge: (submission: ReviewSubmissionApiModel) => void;
  approveFailureOf: (id: SubmissionId) => ApiError | undefined;
};

export const ReviewActionsContext = createContext<ReviewActionsContextValue>({
  busyId: undefined,
  isBusy: false,
  approve: () => undefined,
  openReject: () => undefined,
  openMerge: () => undefined,
  approveFailureOf: () => undefined,
});
