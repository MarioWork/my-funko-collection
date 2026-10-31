import type { ShouldRevalidateFunction } from 'react-router';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';

export { default as Component } from './AppShell';
export { loader } from './appShellLoader';

// The signed-in user rarely changes while the shell is up, so its loader does not re-run after a write or a
// navigation. The one exception is saving a password, which gives the user their username (setPasswordAction
// makes signedInUserMiddleware ask the API again).
export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) => {
  const isPasswordSaved = formAction === AUTH_ROUTES_PATHS.PASSWORD;

  return isPasswordSaved;
};
