import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { mixed, object, string, type InferType } from 'yup';
import {
  newPasswordSchema,
  optionalPasskeyNameSchema,
  passkeyNameSchema,
  passwordSchema,
  setupCodeSchema,
  userNameSchema,
  usernameSchema,
} from '@utils/authUtils';

// The browser's answer to a WebAuthn ceremony, passed through as the library produced it. The API verifies it.
const registrationResponseSchema = mixed<RegistrationResponseJSON>().required();
const authenticationResponseSchema = mixed<AuthenticationResponseJSON>().required();

export const StartSetupSchema = object({
  code: setupCodeSchema,
  name: userNameSchema,
});

export const FinishSetupSchema = StartSetupSchema.shape({
  response: registrationResponseSchema,
  passkeyName: optionalPasskeyNameSchema,
});

export const FinishLoginSchema = object({
  response: authenticationResponseSchema,
});

// Sign-in only needs something typed: a wrong length is just a wrong password, and the API says so.
export const PasswordSignInSchema = object({
  username: string().trim().required('Type your username'),
  password: passwordSchema,
});

export const SetPasswordSchema = object({
  username: usernameSchema,
  password: newPasswordSchema,
});

export const CreatePasskeySchema = object({
  response: registrationResponseSchema,
  name: passkeyNameSchema,
});

export type StartSetup = InferType<typeof StartSetupSchema>;
export type FinishSetup = InferType<typeof FinishSetupSchema>;
export type FinishLogin = InferType<typeof FinishLoginSchema>;
export type CreatePasskey = InferType<typeof CreatePasskeySchema>;
export type PasswordSignIn = InferType<typeof PasswordSignInSchema>;
export type SetPassword = InferType<typeof SetPasswordSchema>;
