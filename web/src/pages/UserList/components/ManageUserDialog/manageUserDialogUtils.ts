import { object, type InferType } from 'yup';
import { USER_ROLE_LABELS, UserRoleUtil, type AuthFailureMessagesUtil } from '@app-types/utility';
import { usernameSchema } from '@utils/authUtils';
import type { NewTemporaryPassword, UpdateUser } from '@services/userService/userService.type';
import { AuthApiErrorCodes } from '@services/authService/authService';

// What the manage dialog sends: the change itself (none for a delete), and `isReauth` once the admin has been asked
// to confirm it's them (403 REAUTH_REQUIRED, see withFreshSignIn).
export type ManageUserFormData = { user?: UpdateUser | NewTemporaryPassword; isReauth?: boolean };

// A user with no username yet gets one with their new temporary password.
export const usernameFormSchema = object({ username: usernameSchema });

export type UsernameFormValues = InferType<typeof usernameFormSchema>;

export const USERNAME_FORM_DEFAULT_VALUES: UsernameFormValues = { username: '' };

// The admin manages one user at a time: these are the three changes, each confirmed in its own dialog.
export const USER_CHANGE = {
  ROLE: 'role',
  TEMPORARY_PASSWORD: 'temporaryPassword',
  DELETE: 'delete',
} as const;
export type UserChange = (typeof USER_CHANGE)[keyof typeof USER_CHANGE];

// Why the last admin's "Make member" and "Delete user" are disabled (docs/GLOSSARY.md: there is always one admin).
export const LAST_ADMIN_REASON = 'There must always be at least one admin. Make someone else an admin first.';

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

// "an admin" / "a member".
export function roleWithArticle(role: UserRoleUtil): string {
  const article = role === UserRoleUtil.ADMIN ? 'an' : 'a';

  return `${article} ${USER_ROLE_LABELS[role].toLowerCase()}`;
}
