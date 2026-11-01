import { object, string, type InferType } from 'yup';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { SubmissionApiReviewStates } from '@services/submissionService/submissionService';
import { rejectionReasonSchema } from '@utils/submissionUtils';

// The API's largest page: a few trusted users send in a handful of funkos, so the list is not paged. The Done tab
// shows the latest reviewed ones.
export const REVIEW_PAGE_SIZE = '100';

type ReviewTab = { value: SubmissionApiReviewStates; label: string };

export const REVIEW_TABS: ReviewTab[] = [
  { value: SubmissionApiReviewStates.WAITING, label: 'Waiting' },
  { value: SubmissionApiReviewStates.DONE, label: 'Done' },
];

type EmptyCopy = { title: string; description: string };

export const REVIEW_EMPTY_COPY: Record<SubmissionApiReviewStates, EmptyCopy> = {
  [SubmissionApiReviewStates.WAITING]: {
    title: 'Nothing waiting',
    description: 'When a member adds a funko the catalogue does not have, it waits here for you.',
  },
  [SubmissionApiReviewStates.DONE]: {
    title: 'Nothing reviewed yet',
    description: 'Submissions you approve, reject or merge show up here.',
  },
};

export function isReviewState(value: string | undefined): value is SubmissionApiReviewStates {
  return value === SubmissionApiReviewStates.WAITING || value === SubmissionApiReviewStates.DONE;
}

const REVIEW_COUNT_WORD_MAP: Record<SubmissionApiReviewStates, string> = {
  [SubmissionApiReviewStates.WAITING]: 'waiting',
  [SubmissionApiReviewStates.DONE]: 'reviewed',
};

// "2 waiting" / "1 reviewed".
export function describeReviewCount(count: number, state: SubmissionApiReviewStates): string {
  return `${count} ${REVIEW_COUNT_WORD_MAP[state]}`;
}

export const rejectSubmissionFormSchema = object({
  reason: rejectionReasonSchema,
});

export type RejectSubmissionFormValues = InferType<typeof rejectSubmissionFormSchema>;

export const REJECT_SUBMISSION_DEFAULT_VALUES: RejectSubmissionFormValues = { reason: '' };

// What the reject dialog posts to its action.
export type RejectSubmissionFormData = { rejection?: RejectSubmissionFormValues };

// The merge dialog's one choice, as the radio group keeps it: the target funko's id as text.
export const mergeSubmissionFormSchema = object({
  targetFunkoId: string().required('Pick the funko it is the same as'),
});

export type MergeSubmissionFormValues = InferType<typeof mergeSubmissionFormSchema>;

// What the merge dialog posts to its action.
export type MergeSubmissionFormData = { merge?: MergeSubmission };

// One funko a submission can be merged into, as the dialog lists it: a maybe-double first (with why), then search
// results. `label` is funkoLabelOf()'s, so a chase or an exclusive never reads like the regular one.
export type MergeTarget = { id: number; label: string; hint: string };
