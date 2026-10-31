import { redirect } from 'react-router';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, defaultRedirectRoute } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';

// Only for someone signed in with a temporary password: anyone else goes where they belong (the first run, the
// login page, or the app for a user who already has their own password).
export async function loader() {
  const { state, user } = await authService.getStatus();

  if (state === AuthStateUtil.SETUP) return redirect(AUTH_ROUTES_PATHS.SETUP);

  if (!user) return redirect(AUTH_ROUTES_PATHS.LOGIN);

  if (!user.mustChangePassword) return redirect(defaultRedirectRoute);

  return { user };
}
