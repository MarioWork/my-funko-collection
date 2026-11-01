// A user as an admin sees them on the Users page: never a password, only how they can sign in today.
import type { UserRoleUtil, UserStateUtil } from '@app-types/utility';

export interface UserApiModel {
  id: number;
  name: string;
  // Null until the user has a password.
  username: string | null;
  role: UserRoleUtil;
  // Limited to looking: signs in and reads, changes only their own password and passkeys.
  isReadOnly: boolean;
  state: UserStateUtil;
  // When the temporary password stops working, while the user has one.
  temporaryPasswordExpiresAt: string | null;
  // The only admin left who is not read-only: they can't be made a member, made read-only or deleted, so there is
  // always at least one admin who can make changes.
  isLastAdmin: boolean;
  createdAt: string;
}

export type UserId = UserApiModel['id'];
