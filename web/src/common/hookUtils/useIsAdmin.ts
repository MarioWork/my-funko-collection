import { UserRoleUtil } from '@app-types/utility';
import { useSignedInUser } from './useSignedInUser';

// True when the signed-in user is an admin: only then does the app show rename / delete on categories and series and
// the Admin group (a funko's controls go by useCanEditFunko). The API refuses those writes to a member anyway (403
// ADMIN_ONLY).
export function useIsAdmin(): boolean {
  const { role } = useSignedInUser();

  return role === UserRoleUtil.ADMIN;
}
