// Who may see and change one funko (docs/adr/0001-shared-catalogue-own-collections.md), for the funkos service and
// its images sub-resource. Only admins change the catalogue; a member changes only their own waiting or rejected
// submission (a rejected one to fix it and send it again, or to delete it).
import { ForbiddenError, NotFoundError } from '../../lib/httpErrors.ts';
import type { SignedInUser } from '../auth/auth.type.ts';
import type { SubmissionStatus } from '../submissions/submissions.type.ts';

const ENTITY = 'Funko';
const ADMIN_ONLY_MESSAGE = 'Only an admin can change a funko in the catalogue';

export type FunkoAccess = {
  status: SubmissionStatus;
  submittedById: number | null;
};

function isSubmittedBy(user: SignedInUser, funko: FunkoAccess): boolean {
  return funko.submittedById === user.userId;
}

// The catalogue `userId` browses (and may add to a collection): approved, or their own waiting submission. Mirrors
// catalogueOf() in lib/catalogueVisibility.ts.
export function isInCatalogueOf(userId: number, funko: FunkoAccess): boolean {
  const isApproved = funko.status === 'APPROVED';
  const isOwnWaiting = funko.status === 'WAITING' && funko.submittedById === userId;

  return isApproved || isOwnWaiting;
}

// Opened by id: everyone sees the catalogue, a sender their own submissions whatever became of them, an admin
// everything.
export function canSeeFunko(user: SignedInUser, funko: FunkoAccess): boolean {
  const isApproved = funko.status === 'APPROVED';

  return user.isAdmin || isApproved || isSubmittedBy(user, funko);
}

// A submission its sender still looks after: waiting for an admin, or rejected and theirs to fix or delete.
export function isOpenSubmission(funko: FunkoAccess): boolean {
  return funko.status === 'WAITING' || funko.status === 'REJECTED';
}

export function canEditFunko(user: SignedInUser, funko: FunkoAccess): boolean {
  return user.isAdmin || (isOpenSubmission(funko) && isSubmittedBy(user, funko));
}

// An admin changing someone else's submission before it is approved: its sender is told (`changedByAdminAt`). An
// orphan submission (its sender removed) has nobody to tell.
export function isAdminChangingSubmission(user: SignedInUser, funko: FunkoAccess): boolean {
  const hasOtherSender = funko.submittedById !== null && funko.submittedById !== user.userId;

  return user.isAdmin && isOpenSubmission(funko) && hasOtherSender;
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
