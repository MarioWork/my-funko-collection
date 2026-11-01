import { object, type InferType } from 'yup';
import { USER_ROLE_LABELS, UserRoleUtil, type AuthFailureMessagesUtil } from '@app-types/utility';
import { usernameSchema } from '@utils/authUtils';
import type { CreateTemporaryPassword, UpdateUser } from '@services/userService/userService.type';
import { AuthApiErrorCodes } from '@services/authService/authService';

// What the manage dialog sends: the change itself (none for a delete), and `isReauth` once the admin has been asked
// to confirm it's them (403 REAUTH_REQUIRED, see withFreshSignIn).
export type ManageUserFormData = { user?: UpdateUser | CreateTemporaryPassword; isReauth?: boolean };

// A user with no username yet gets one with their new temporary password.
export const usernameFormSchema = object({ username: usernameSchema });

export type UsernameFormValues = InferType<typeof usernameFormSchema>;

export const USERNAME_FORM_DEFAULT_VALUES: UsernameFormValues = { username: '' };

// The admin manages one user at a time: these are the four changes, each confirmed in its own dialog.
export const UserChange = {
  ROLE: 'role',
  READ_ONLY: 'readOnly',
  TEMPORARY_PASSWORD: 'temporaryPassword',
  DELETE: 'delete',
} as const;
export type UserChange = (typeof UserChange)[keyof typeof UserChange];

// Why the last admin's "Make member", "Make read-only" and "Delete user" are disabled (docs/GLOSSARY.md: there is
// always one admin who is not read-only).
export const LAST_ADMIN_REASON =
  'There must always be at least one admin who can make changes. Make someone else an admin first.';

// What a read-only user may do, and what everyone else may, in the manage panel and the read-only confirm.
export const READ_ONLY_HINTS = {
  READ_ONLY: 'Read-only: they look, and look after their own password and passkeys, but change nothing else.',
  CAN_CHANGE: 'They can make changes, as their role allows.',
} as const;

// "Make read-only" / "Allow changes": the button offers the other setting.
export function readOnlyLabel(isReadOnly: boolean): string {
  return isReadOnly ? 'Allow changes' : 'Make read-only';
}

// What each role may do, in the manage panel and the role change's confirm.
export const ROLE_HINTS: Record<UserRoleUtil, string> = {
  [UserRoleUtil.ADMIN]: 'An admin manages users, images and the catalogue.',
  [UserRoleUtil.MEMBER]: 'A member keeps their own collections and reads the catalogue.',
};

// What each change does to the user's sign-in, said in every confirm dialog.
export const SIGNS_OUT_EVERYWHERE = 'They are signed out on every device.';

export const MANAGE_USER_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
};

// Two roles: the button offers the other one.
const OTHER_ROLE: Record<UserRoleUtil, UserRoleUtil> = {
  [UserRoleUtil.ADMIN]: UserRoleUtil.MEMBER,
  [UserRoleUtil.MEMBER]: UserRoleUtil.ADMIN,
};

export function otherRoleOf(role: UserRoleUtil): UserRoleUtil {
  return OTHER_ROLE[role];
}

// "Make admin" / "Make member".
export function makeRoleLabel(role: UserRoleUtil): string {
  return `Make ${USER_ROLE_LABELS[role].toLowerCase()}`;
}

const ROLE_ARTICLE: Record<UserRoleUtil, string> = {
  [UserRoleUtil.ADMIN]: 'an',
  [UserRoleUtil.MEMBER]: 'a',
};

// "an admin" / "a member".
export function roleWithArticle(role: UserRoleUtil): string {
  return `${ROLE_ARTICLE[role]} ${USER_ROLE_LABELS[role].toLowerCase()}`;
}
