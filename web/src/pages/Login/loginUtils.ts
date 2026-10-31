import { object, type InferType } from 'yup';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { PasswordSignInSchema } from '@services/authService/authService.type';
import type { AuthFailureMessagesUtil } from '@app-types/utility';

// The two ways in, sent with each submit so the one route action knows which sign-in to run.
export const LoginIntents = {
  PASSKEY: 'passkey',
  PASSWORD: 'password',
} as const;
export type LoginIntents = (typeof LoginIntents)[keyof typeof LoginIntents];

export const passwordSignInFormSchema = object({
  username: PasswordSignInSchema.fields.username,
  password: PasswordSignInSchema.fields.password,
});

export type PasswordSignInFormValues = InferType<typeof passwordSignInFormSchema>;

export type LoginFormData = { intent: LoginIntents; credentials?: PasswordSignInFormValues };

export const LOGIN_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That passkey didn't work. Try again, or pick another one.",
  [AuthApiErrorCodes.NOT_SET_UP]: 'Nobody has set up this app yet. Open the setup link from the server log first.',
};

export const PASSWORD_LOGIN_FAILURE_MESSAGES: AuthFailureMessagesUtil = {
  ...LOGIN_FAILURE_MESSAGES,
  [AuthApiErrorCodes.SIGN_IN_FAILED]: "That username and password don't match. Check them and try again.",
};

// What to run on the server when every way in is gone (auth contract, "Recovery").
export const RESET_COMMAND = 'docker compose exec api yarn auth:reset';
