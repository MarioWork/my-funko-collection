import { useRouteLoaderData } from 'react-router';
import type { AuthUserApiModel } from '@app-types/models';
import { UserRoleUtil, type LoaderDataUtil } from '@app-types/utility';
import type { loader } from '@application/layout/AppShell/appShellLoader';
import { APP_SHELL_ROUTE_ID } from '@application/routes/routesUtils';

// Outside the shell nobody is signed in: the least a user may do.
const UNKNOWN_USER: AuthUserApiModel = { name: '', username: null, role: UserRoleUtil.MEMBER };

// The signed-in user, from the app shell's loader. Any page inside the shell can read it without another request.
export function useSignedInUser(): AuthUserApiModel {
  const shellData = useRouteLoaderData<LoaderDataUtil<typeof loader>>(APP_SHELL_ROUTE_ID);

  return shellData?.user ?? UNKNOWN_USER;
}
