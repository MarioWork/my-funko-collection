import type { ShouldRevalidateFunction } from 'react-router';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';

export { default as Component } from './AppShell';
export { loader } from './appShellLoader';

// The signed-in user rarely changes while the shell is up, so its status check does not re-run after a write or a
// navigation: one request per visit, not one per page. Signing out leaves the shell, and coming back mounts it
// again. The one exception is saving a password, which gives the user their username.
export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) => {
  const isPasswordSaved = formAction === AUTH_ROUTES_PATHS.PASSWORD;

  return isPasswordSaved;
};
