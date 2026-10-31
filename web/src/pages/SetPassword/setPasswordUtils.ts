import { object, type InferType } from 'yup';
import type { AuthFailureMessagesUtil } from '@app-types/utility';
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

// What the form sends: the new password under the username the admin gave (from the loader).
export type SetPasswordFormData = {
  intent: SetPasswordIntents;
  credentials?: SetOwnPasswordFormValues & { username: string | null };
};

// Answers about the password itself, shown on its field rather than in the alert.
export const PASSWORD_FIELD_CODES = new Set<string>([
  AuthApiErrorCodes.COMMON_PASSWORD,
  AuthApiErrorCodes.PASSWORD_REUSED,
]);

export const SET_PASSWORD_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.REAUTH_REQUIRED]:
    'You signed in more than 10 minutes ago. Sign out, then sign in again with your temporary password.',
};
