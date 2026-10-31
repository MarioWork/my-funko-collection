import type { FunkoApiModel } from '@app-types/models';
import { SubmissionStatusUtil } from '@app-types/utility';

type FunkoStanding = Pick<FunkoApiModel, 'status' | 'isSubmittedByMe'>;

// The API's rule (docs/adr/0001-shared-catalogue-own-collections.md): only an admin changes the catalogue; a member
// changes only their own waiting submission, and its images.
export function canEditFunko(funko: FunkoStanding, isAdmin: boolean): boolean {
  const isOwnWaiting = funko.isSubmittedByMe && funko.status === SubmissionStatusUtil.WAITING;

  return isAdmin || isOwnWaiting;
}
