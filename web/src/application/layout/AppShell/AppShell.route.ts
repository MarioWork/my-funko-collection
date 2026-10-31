import type { ShouldRevalidateFunction } from 'react-router';
import { isSignedInUserKnown } from '@application/routes/signedInUserMiddleware';

export { default as Component } from './AppShell';
export { loader } from './appShellLoader';

// The signed-in user rarely changes while the shell is up, so its loader does not re-run after a write or a
// navigation. It does once the user was forgotten (a saved password gives them a username, a refused admin-only
// call means a lost role): signedInUserMiddleware then asks the API again and the shell shows the fresh answer.
export const shouldRevalidate: ShouldRevalidateFunction = () => !isSignedInUserKnown();
