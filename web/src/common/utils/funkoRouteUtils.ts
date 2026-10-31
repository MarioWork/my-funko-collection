import { data, type RouterContextProvider } from 'react-router';
import { isAdminIn } from '@utils/adminRouteUtils';
import { canEditFunko, type FunkoStanding } from '@utils/funkoAccessUtils';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

// For Edit funko's loader and action: an admin edits any funko, a member only their own waiting submission. Anyone
// else opening its URL gets the "for admins" error page (a 403 route error), as assertAdmin() gives.
export function assertCanEditFunko(context: Readonly<RouterContextProvider>, funko: FunkoStanding): void {
  // React Router's own way to end a loader with an HTTP status, read by the error boundary; not an Error object.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!canEditFunko(funko, isAdminIn(context))) throw data(null, { status: FORBIDDEN_STATUS });
}
