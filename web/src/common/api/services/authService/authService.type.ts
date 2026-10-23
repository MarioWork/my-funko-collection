import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { mixed, object, type InferType } from 'yup';
import { optionalPasskeyNameSchema, passkeyNameSchema, setupCodeSchema, userNameSchema } from '@utils/authUtils';

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

export const CreatePasskeySchema = object({
  response: registrationResponseSchema,
  name: passkeyNameSchema,
});

export type StartSetup = InferType<typeof StartSetupSchema>;
export type FinishSetup = InferType<typeof FinishSetupSchema>;
export type FinishLogin = InferType<typeof FinishLoginSchema>;
export type CreatePasskey = InferType<typeof CreatePasskeySchema>;
