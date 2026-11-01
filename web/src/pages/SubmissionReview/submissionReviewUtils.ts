import { object, type InferType } from 'yup';
import type { PossibleDoubleApiModel, ReviewSubmissionApiModel } from '@app-types/models';
import { SubmissionStatusUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
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

// A submission's maybe-doubles that are in the catalogue: another waiting submission cannot be merged into.
export function catalogueDoublesOf(submission: ReviewSubmissionApiModel): PossibleDoubleApiModel[] {
  return submission.possibleDoubles.filter((double) => double.status === SubmissionStatusUtil.APPROVED);
}

// Two ways into one merge flow. Merge, offered only when the review found catalogue doubles: with one it opens
// straight on the side-by-side view with it, with several on the step that picks one (they are listed first).
// Undefined when there are none.
export function detectedMergeLinkOf(submission: ReviewSubmissionApiModel): string | undefined {
  const doubles = catalogueDoublesOf(submission);
  const funkoId = String(submission.id);

  if (doubles.length === 0) return undefined;

  const onlyDouble = doubles.length === 1 ? doubles[0] : undefined;

  return SUBMISSION_ROUTES_PATHS.mergeInto(funkoId, onlyDouble && String(onlyDouble.id));
}
