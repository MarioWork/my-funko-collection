import { createContext, redirect, type MiddlewareFunction } from 'react-router';
import type { AuthUserApiModel } from '@app-types/models';
import { AuthStateUtil } from '@app-types/utility';
import authService from '@services/authService/authService';
import { loginPathFor, returnPathOf } from '@utils/authRedirectUtils';
import { AUTH_ROUTES_PATHS } from './routesUtils';

// The signed-in user, for every loader and action inside the app shell: `context.get(signedInUserContext)`.
// No default value: reading it outside the shell throws instead of handing out a made-up user.
export const signedInUserContext = createContext<AuthUserApiModel>();

// Client middleware runs on every navigation and fetcher call, so the status is asked once and kept here until
// something can change it: signing in or out, a lost session or a refused admin-only call (authMiddleware), or a
// saved password. Each of those calls forgetSignedInUser.
let knownUser: AuthUserApiModel | undefined;

export function forgetSignedInUser(): void {
  knownUser = undefined;
}

// False once the user was forgotten: the shell's shouldRevalidate then re-runs its loader for the fresh user.
export function isSignedInUserKnown(): boolean {
  return knownUser !== undefined;
}

async function loadSignedInUser(request: Request): Promise<AuthUserApiModel> {
  const status = await authService.getStatus();
  const isSignedIn = status.state === AuthStateUtil.SIGNED_IN;

  if (isSignedIn && status.user) return status.user;

  const isFirstRun = status.state === AuthStateUtil.SETUP;
  const gatePath = isFirstRun ? AUTH_ROUTES_PATHS.SETUP : loginPathFor(returnPathOf(request));

  // A middleware ends the request with a thrown redirect (React Router's documented way): a Response, not an
  // Error, on purpose.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect(gatePath);
}

// The app shell's gate: every app page needs a signed-in user. A first-run app goes to the setup page, a visitor
// without a session to the login page, a user signed in with a temporary password to "choose your password" (the
// API refuses everything else until then); otherwise the user goes into the router context for the loaders below.
export const signedInUserMiddleware: MiddlewareFunction = async ({ request, context }) => {
  knownUser ??= await loadSignedInUser(request);

  // eslint-disable-next-line @typescript-eslint/only-throw-error -- a redirect ends a middleware (see above)
  if (knownUser.mustChangePassword) throw redirect(AUTH_ROUTES_PATHS.SET_PASSWORD);

  context.set(signedInUserContext, knownUser);
};
