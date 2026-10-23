import { object, type InferType } from 'yup';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { passkeyNameSchema } from '@utils/authUtils';
import { PasskeyCeremonyFailureUtil, type AuthFailureMessagesUtil } from '@app-types/utility';

export const addPasskeyFormSchema = object({
  name: passkeyNameSchema,
});

export type AddPasskeyFormValues = InferType<typeof addPasskeyFormSchema>;

// `isReauth`: the user has just been asked to confirm it's them (403 REAUTH_REQUIRED), see withFreshSignIn.
export type AddPasskeyFormData = { passkey: AddPasskeyFormValues; isReauth?: boolean };

export type DeletePasskeyFormData = { isReauth?: boolean };

// The shared "confirm it's you" step of adding and removing a passkey.
export const CONFIRM_IDENTITY_COPY = {
  TITLE: "Confirm it's you",
  DESCRIPTION: 'Changing your passkeys needs a sign-in from the last 10 minutes. Use any of your passkeys to confirm.',
  BUTTON: 'Confirm with passkey',
} as const;

export const LAST_PASSKEY_REASON = 'You need at least one passkey.';

export const PASSKEY_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [PasskeyCeremonyFailureUtil.ALREADY_REGISTERED]:
    'This device already has a passkey for the app. Pick another place to save it.',
  [AuthApiErrorCodes.LAST_PASSKEY]: 'You need at least one passkey, so this one stays.',
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
};
