import { data, isRouteErrorResponse, type RouterContextProvider } from 'react-router';
import { signedInUserContext } from '@application/routes/signedInUserMiddleware';
import { FORBIDDEN_STATUS } from '@utils/httpStatusUtils';

// The body of the 403 route error a read-only user gets on a page made only for writing: the error page tells it
// apart from the admin-only one by this.
const READ_ONLY_ROUTE_ERROR_REASON = 'READ_ONLY';

type ReadOnlyRouteError = { reason: typeof READ_ONLY_ROUTE_ERROR_REASON };

// Whether the signed-in user, from the router context, is read-only: for loaders, where no hook runs.
export function isReadOnlyIn(context: Readonly<RouterContextProvider>): boolean {
  return context.get(signedInUserContext).isReadOnly;
}

// For the loader of a page that exists only to write (Add, Edit funko, the collection and item dialogs, New user):
// a read-only user opening its URL directly gets the error page's "read-only" copy (a 403 route error) instead of
// a form whose save the API refuses. The buttons that lead there are disabled for them already.
export function assertCanWrite(context: Readonly<RouterContextProvider>): void {
  const body: ReadOnlyRouteError = { reason: READ_ONLY_ROUTE_ERROR_REASON };

  // React Router's own way to end a loader with an HTTP status, read by the error boundary; not an Error object.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (isReadOnlyIn(context)) throw data(body, { status: FORBIDDEN_STATUS });
}

function isReadOnlyRouteErrorBody(body: unknown): body is ReadOnlyRouteError {
  return typeof body === 'object' && body !== null && 'reason' in body && body.reason === READ_ONLY_ROUTE_ERROR_REASON;
}

// Whether a route error is the one assertCanWrite throws.
export function isReadOnlyRouteError(error: unknown): boolean {
  return isRouteErrorResponse(error) && error.status === FORBIDDEN_STATUS && isReadOnlyRouteErrorBody(error.data);
}
