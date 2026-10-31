import { data, type RouterContextProvider } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { UserRoleUtil } from '@app-types/utility';
import { signedInUserContext } from '@application/routes/signedInUserMiddleware';
import { canEditFunko } from '@utils/funkoAccessUtils';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

function isAdminIn(context: Readonly<RouterContextProvider>): boolean {
  const { role } = context.get(signedInUserContext);

  return role === UserRoleUtil.ADMIN;
}

// For the loader and action of an admin-only page (Images, Users): a member opening its URL directly gets the
// error page's "for admins" copy (a 403 route error) instead of a page whose every write the API refuses. The user
// comes from the router context, put there by the app shell's signedInUserMiddleware: no extra request.
export function assertAdmin(context: Readonly<RouterContextProvider>): void {
  // React Router's own way to end a loader with an HTTP status: the error boundary reads it with
  // isRouteErrorResponse. It is not an Error object on purpose.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!isAdminIn(context)) throw data(null, { status: FORBIDDEN_STATUS });
}

// For Edit funko: an admin edits any funko, a member only their own waiting submission. Anyone else opening its URL
// gets the same "for admins" error page.
export function assertCanEditFunko(
  context: Readonly<RouterContextProvider>,
  funko: Pick<FunkoApiModel, 'status' | 'isSubmittedByMe'>,
): void {
  // See assertAdmin: a route error response, not an Error.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!canEditFunko(funko, isAdminIn(context))) throw data(null, { status: FORBIDDEN_STATUS });
}
