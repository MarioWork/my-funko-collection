import { object, type InferType } from 'yup';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { optionalPasskeyNameSchema, setupCodeSchema, userNameSchema } from '@utils/authUtils';
import { PasskeyCeremonyFailureUtil, type AuthFailureMessagesUtil } from '@app-types/utility';

export const setupFormSchema = object({
  code: setupCodeSchema,
  name: userNameSchema,
  passkeyName: optionalPasskeyNameSchema,
});

export type SetupFormValues = InferType<typeof setupFormSchema>;

export type SetupFormData = { setup: SetupFormValues };

// Where the first-run link is printed.
export const LOGS_COMMAND = 'docker compose logs api';

export const SETUP_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.INVALID_SETUP_CODE]:
    'That setup code is wrong or was already used. Paste the newest one from the server log.',
  [AuthApiErrorCodes.ALREADY_SET_UP]: 'Good news: this app is already set up. Sign in with your passkey instead.',
  [PasskeyCeremonyFailureUtil.ALREADY_REGISTERED]:
    'This device already has a passkey for the app. Pick another place to save it.',
};
