import { object, type InferType } from 'yup';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { SetPasswordSchema } from '@services/authService/authService.type';
import { passkeyNameSchema } from '@utils/authUtils';
import { PasskeyCeremonyFailureUtil, type AuthFailureMessagesUtil, type ReauthUtil } from '@app-types/utility';

export const addPasskeyFormSchema = object({
  name: passkeyNameSchema,
});

export type AddPasskeyFormValues = InferType<typeof addPasskeyFormSchema>;

// `reauth`: how the user confirms it's them once asked (403 REAUTH_REQUIRED), see withRecentSignIn.
export type AddPasskeyFormData = { passkey: AddPasskeyFormValues; reauth?: ReauthUtil };

export type DeletePasskeyFormData = { reauth?: ReauthUtil };

// The form sends exactly what the API takes.
export const setPasswordFormSchema = SetPasswordSchema;

export type SetPasswordFormValues = InferType<typeof setPasswordFormSchema>;

export type SetPasswordFormData = { credentials: SetPasswordFormValues; reauth?: ReauthUtil };

export const LAST_PASSKEY_REASON = 'You need at least one passkey.';

export const PASSWORD_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
};

export const PASSKEY_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [PasskeyCeremonyFailureUtil.ALREADY_REGISTERED]:
    'This device already has a passkey for the app. Pick another place to save it.',
  [AuthApiErrorCodes.LAST_PASSKEY]: 'You need at least one passkey, so this one stays.',
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
};
