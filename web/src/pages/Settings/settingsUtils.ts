import { object, type InferType } from 'yup';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { SetPasswordSchema } from '@services/authService/authService.type';
import { passkeyNameSchema } from '@utils/authUtils';
import { PasskeyCeremonyFailureUtil, type AuthFailureMessagesUtil } from '@app-types/utility';

export const addPasskeyFormSchema = object({
  name: passkeyNameSchema,
});

export type AddPasskeyFormValues = InferType<typeof addPasskeyFormSchema>;

// `isReauth`: the user has just been asked to confirm it's them (403 REAUTH_REQUIRED), see withFreshSignIn.
export type AddPasskeyFormData = { passkey: AddPasskeyFormValues; isReauth?: boolean };

export type DeletePasskeyFormData = { isReauth?: boolean };

// The form sends exactly what the API takes.
export const setPasswordFormSchema = SetPasswordSchema;

export type SetPasswordFormValues = InferType<typeof setPasswordFormSchema>;

export type SetPasswordFormData = { credentials: SetPasswordFormValues; isReauth?: boolean };

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
