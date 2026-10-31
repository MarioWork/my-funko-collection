// A user as an admin sees them on the Users page: never a password, only how they can sign in today.
import type { UserRoleUtil, UserStateUtil } from '@app-types/utility';

export interface UserApiModel {
  id: number;
  name: string;
  // Null until the user has a password.
  username: string | null;
  role: UserRoleUtil;
  state: UserStateUtil;
  // When the temporary password stops working, while the user has one.
  temporaryPasswordExpiresAt: string | null;
  createdAt: string;
}

export type UserId = UserApiModel['id'];
