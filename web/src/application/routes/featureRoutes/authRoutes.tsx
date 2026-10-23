import type { RouteObject } from 'react-router';
import { AUTH_ROUTES_PATHS } from '../routesUtils';

const settingsActions = () => import('@pages/Settings/settingsActions');

// Outside the app shell: no sidebar, and no session needed to open them.
export const authRoutes: RouteObject[] = [
  { path: AUTH_ROUTES_PATHS.LOGIN, lazy: () => import('@pages/Login/Login.route') },
  { path: AUTH_ROUTES_PATHS.SETUP, lazy: () => import('@pages/Setup/Setup.route') },
];

// Inside the app shell: the action-only routes behind Settings → Security.
export const securityRoutes: RouteObject[] = [
  {
    path: AUTH_ROUTES_PATHS.PASSKEYS,
    lazy: { action: async () => (await settingsActions()).addPasskeyAction },
  },
  {
    path: AUTH_ROUTES_PATHS.passkey(),
    lazy: { action: async () => (await settingsActions()).deletePasskeyAction },
  },
  {
    path: AUTH_ROUTES_PATHS.SIGN_OUT,
    lazy: { action: async () => (await settingsActions()).signOutAction },
  },
  {
    path: AUTH_ROUTES_PATHS.SIGN_OUT_EVERYWHERE,
    lazy: { action: async () => (await settingsActions()).signOutEverywhereAction },
  },
];
