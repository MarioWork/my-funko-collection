import { data } from 'react-router';
import { UserRoleUtil } from '@app-types/utility';
import authService from '@services/authService/authService';

const FORBIDDEN_STATUS = 403;

// For the loader of an admin-only page (Images, Edit funko): a member opening its URL directly gets the error
// page's "for admins" copy (a 403 route error) instead of a page whose every write the API refuses.
export async function assertAdmin(): Promise<void> {
  const status = await authService.getStatus();

  const isAdmin = status.user?.role === UserRoleUtil.ADMIN;

  // React Router's own way to end a loader with an HTTP status: the error boundary reads it with
  // isRouteErrorResponse. It is not an Error object on purpose.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!isAdmin) throw data(null, { status: FORBIDDEN_STATUS });
}
