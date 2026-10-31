// Who may see and change one funko (docs/adr/0001-shared-catalogue-own-collections.md), for the funkos service and
// its images sub-resource. Only admins change the catalogue; a member changes only their own waiting submission.
import { ForbiddenError, NotFoundError } from '../../lib/httpErrors.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import type { SubmissionStatus } from '../submissions/submissions.type.ts';

const ENTITY = 'Funko';
const ADMIN_ONLY_MESSAGE = 'Only an admin can change a funko in the catalogue';

export type FunkoAccess = {
  status: SubmissionStatus;
  submittedById: number | null;
};

export function isSubmittedBy(user: SignedInUser, funko: FunkoAccess): boolean {
  return funko.submittedById === user.userId;
}

// Everyone sees the catalogue, a sender their own submissions, an admin everything.
export function canSeeFunko(user: SignedInUser, funko: FunkoAccess): boolean {
  const isApproved = funko.status === 'APPROVED';

  return user.isAdmin || isApproved || isSubmittedBy(user, funko);
}

export function canEditFunko(user: SignedInUser, funko: FunkoAccess): boolean {
  const isWaiting = funko.status === 'WAITING';

  return user.isAdmin || (isWaiting && isSubmittedBy(user, funko));
}

// One the user cannot see does not exist for them (404, never a hint that another member sent it in); one they see
// but may not change answers 403 ADMIN_ONLY, like an admin-only route.
export function assertCanEditFunko<Funko extends FunkoAccess>(
  user: SignedInUser,
  funkoId: number,
  funko: Funko | undefined,
): Funko {
  if (!funko || !canSeeFunko(user, funko)) throw new NotFoundError(ENTITY, funkoId);

  if (!canEditFunko(user, funko)) throw new ForbiddenError(ADMIN_ONLY_MESSAGE, 'ADMIN_ONLY');

  return funko;
}
