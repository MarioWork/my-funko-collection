import type { FunkoApiModel } from '@app-types/models';
import { SubmissionStatusUtil } from '@app-types/utility';

// Where a funko stands for the signed-in user: in the catalogue or a submission, and whether they sent it in.
export type FunkoStanding = Pick<FunkoApiModel, 'status' | 'isSubmittedByMe'>;

// The signed-in user's own submission, still waiting for an admin.
export function isOwnWaitingSubmission(funko: FunkoStanding): boolean {
  return funko.isSubmittedByMe && funko.status === SubmissionStatusUtil.WAITING;
}

// The signed-in user's own submission that an admin rejected: theirs to fix and send again, or delete.
export function isOwnRejectedSubmission(funko: FunkoStanding): boolean {
  return funko.isSubmittedByMe && funko.status === SubmissionStatusUtil.REJECTED;
}

// The API's rule (docs/adr/0001-shared-catalogue-own-collections.md): only an admin changes the catalogue; a member
// changes only their own waiting or rejected submission, and its images.
export function canEditFunko(funko: FunkoStanding, isAdmin: boolean): boolean {
  return isAdmin || isOwnWaitingSubmission(funko) || isOwnRejectedSubmission(funko);
}
