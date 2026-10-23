import { redirect, type LoaderFunctionArgs } from 'react-router';
import { AuthStateUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import authService from '@services/authService/authService';
import { redirectTargetOf } from '@utils/authRedirectUtils';

// Only for someone who can sign in: before the first run there is nobody to sign in as, and a signed-in user goes
// straight on to where they were heading.
export async function loader({ request }: LoaderFunctionArgs) {
  const { state } = await authService.getStatus();

  if (state === AuthStateUtil.SETUP) return redirect(AUTH_ROUTES_PATHS.SETUP);

  if (state === AuthStateUtil.SIGNED_IN) return redirect(redirectTargetOf(new URL(request.url)));

  return null;
}
