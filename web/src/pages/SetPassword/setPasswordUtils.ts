import { object, type InferType } from 'yup';
import type { AuthFailureMessagesUtil, ReauthUtil } from '@app-types/utility';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { newPasswordSchema } from '@utils/authUtils';

// The two things the page can do, sent with each submit so the one route action knows which to run.
export const SetPasswordIntents = {
  SAVE: 'save',
  SIGN_OUT: 'signOut',
} as const;
export type SetPasswordIntents = (typeof SetPasswordIntents)[keyof typeof SetPasswordIntents];

// The username is the one the admin gave; only the password is typed here.
export const setOwnPasswordFormSchema = object({
  password: newPasswordSchema,
});

export type SetOwnPasswordFormValues = InferType<typeof setOwnPasswordFormSchema>;

// What the form sends: the new password under the username the admin gave (from the loader), and `reauth` once the
// API asked for a recent sign-in (the temporary password confirms it, see withRecentSignIn).
export type SetPasswordFormData = {
  intent: SetPasswordIntents;
  credentials?: SetOwnPasswordFormValues & { username: string | null };
  reauth?: ReauthUtil;
};

// Answers about the password itself, shown on its field rather than in the alert.
export const PASSWORD_FIELD_CODES = new Set<string>([
  AuthApiErrorCodes.COMMON_PASSWORD,
  AuthApiErrorCodes.PASSWORD_REUSED,
]);

// The confirm step shows REAUTH_REQUIRED and a wrong password itself; the rest falls back to the API's own message.
export const SET_PASSWORD_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.TEMPORARY_PASSWORD_EXPIRED]:
    'Your temporary password has expired, so it can’t confirm it’s you. Sign out and ask an admin for a new one.',
};

// The temporary-password page confirms a recent sign-in with that password only.
export const CONFIRM_WITH_TEMPORARY_PASSWORD =
  'This needs a recent sign-in (within the last 10 minutes). Type your temporary password to confirm it’s you, then the new one is saved.';
