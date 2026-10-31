import { data, type RouterContextProvider } from 'react-router';
import { UserRoleUtil } from '@app-types/utility';
import { signedInUserContext } from '@application/routes/signedInUserMiddleware';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

// For the loader and action of an admin-only page (Images, Edit funko): a member opening its URL directly gets the
// error page's "for admins" copy (a 403 route error) instead of a page whose every write the API refuses. The user
// comes from the router context, put there by the app shell's signedInUserMiddleware: no extra request.
export function assertAdmin(context: Readonly<RouterContextProvider>): void {
  const { role } = context.get(signedInUserContext);

  const isAdmin = role === UserRoleUtil.ADMIN;

  // React Router's own way to end a loader with an HTTP status: the error boundary reads it with
  // isRouteErrorResponse. It is not an Error object on purpose.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!isAdmin) throw data(null, { status: FORBIDDEN_STATUS });
}
