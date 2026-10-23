import { redirect, type LoaderFunctionArgs } from 'react-router';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS, AUTH_SEARCH_PARAMS, defaultRedirectRoute } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';

// Only before the first run. Afterwards the setup link is spent: a signed-in user goes to the app, anyone else to
// the login page. The code comes from the link the server printed (/setup?code=...); without it the page asks.
export async function loader({ request }: LoaderFunctionArgs) {
  const { state } = await authService.getStatus();

  if (state === AuthStateUtil.SIGNED_IN) return redirect(defaultRedirectRoute);

  if (state === AuthStateUtil.SIGNED_OUT) return redirect(AUTH_ROUTES_PATHS.LOGIN);

  const code = new URL(request.url).searchParams.get(AUTH_SEARCH_PARAMS.CODE) ?? '';

  return { code };
}
