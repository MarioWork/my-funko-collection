import type { LoaderFunctionArgs } from 'react-router';
import type { UnreadCountApiModel } from '@app-types/models';
import { signedInUserContext } from '@application/routes/signedInUserMiddleware';
import notificationService from '@services/notificationService/notificationService';

// The bell's number, or null when it can't be read. Caught on purpose (the one read here that is not left to throw):
// the count is a badge, and a failed one must never take the page down with it, nor reject unhandled when nothing
// renders it (the shell reloads after signing out, as the session ends).
async function readUnreadCount(): Promise<UnreadCountApiModel | null> {
  try {
    return await notificationService.getUnreadCount();
  } catch {
    return null;
  }
}

// The signed-in user, for useSignedInUser and useIsAdmin. The shell route's signedInUserMiddleware has already
// checked the session (and sent anyone else to the setup or login page) and put the user in the router context.
// `unreadCount` is left as a promise: the shell never waits for it (UnreadCountAwait shows it when it comes).
export function loader({ context }: LoaderFunctionArgs) {
  return { user: context.get(signedInUserContext), unreadCount: readUnreadCount() };
}
