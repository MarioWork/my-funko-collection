import type { ShouldRevalidateFunction } from 'react-router';
import { isSignedInUserKnown } from '@application/routes/signedInUserMiddleware';

export { default as Component } from './AppShell';
export { loader } from './appShellLoader';

// The shell's loader holds the signed-in user and the bell's unread count. The user comes from the middleware's
// cache, so re-running it costs one small request for the count. It re-runs after every write (a notification may
// have been read, or written) and on every move to another page, so the count is fresh wherever the user goes; not
// when only the search params change (typing in a search box), and always once the user was forgotten (a saved
// password, a refused admin-only call): signedInUserMiddleware then asks the API again. No poll: a notification that
// arrives while the user stays on one page shows at their next click.
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, formMethod }) => {
  const isSubmission = formMethod !== undefined;
  const isOtherPage = currentUrl.pathname !== nextUrl.pathname;

  return isSubmission || isOtherPage || !isSignedInUserKnown();
};
