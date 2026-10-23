import { redirect, type LoaderFunctionArgs } from 'react-router';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';
import { appPathOf, loginPathFor } from '@utils/authRedirectUtils';

// The gate in front of every app page. Runs once, when the shell first mounts (AppShell.route turns revalidation
// off); after that a lost session shows up as a 401 and the root authMiddleware sends the user to sign in.
export async function loader({ request }: LoaderFunctionArgs) {
  const status = await authService.getStatus();

  if (status.state === AuthStateUtil.SETUP) return redirect(AUTH_ROUTES_PATHS.SETUP);

  const isSignedIn = status.state === AuthStateUtil.SIGNED_IN;

  if (!isSignedIn || !status.user) return redirect(loginPathFor(appPathOf(new URL(request.url))));

  return { user: status.user };
}
