import { UserRoleUtil } from '@app-types/utility';
import { useSignedInUser } from './useSignedInUser';

// True when the signed-in user is an admin: only then does the app show catalogue edit controls (funkos,
// categories, series, images) and the Admin group. The API refuses those writes to a member anyway (403 ADMIN_ONLY).
export function useIsAdmin(): boolean {
  const { role } = useSignedInUser();

  return role === UserRoleUtil.ADMIN;
}
