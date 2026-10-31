import { z } from 'zod';

export const AUTH_STATES = ['setup', 'signedOut', 'signedIn'] as const;

const NAME_MAX_LENGTH = 60;
// NIST SP 800-63B-4: at least 15 characters for a password used on its own, and room for long passphrases.
export const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 256;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
// Generous ceilings: real values are a few hundred bytes, these only stop absurd bodies early.
const ID_MAX_LENGTH = 1024;
const ENCODED_MAX_LENGTH = 65_536;
const AUTHENTICATOR_TRANSPORTS = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'] as const;
const AUTHENTICATOR_ATTACHMENTS = ['platform', 'cross-platform'] as const;

const base64Url = (maxLength: number) =>
  z
    .string()
    .min(1)
    .max(maxLength)
    .regex(/^[A-Za-z0-9_-]+$/, 'Must be base64url');

const DisplayNameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

// Letters, digits, dot, dash and underscore; compared and stored lower-case, so "Mario" signs in as "mario".
const UsernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(/^[A-Za-z0-9._-]+$/, 'Use letters, digits, dots, dashes or underscores')
  .transform((username) => username.toLowerCase());

// Never trimmed: every character typed is part of the password. No character-mix rules.
const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH);

// What @simplewebauthn/browser sends back; the library checks the signed contents, this only checks the shape.
const ClientExtensionResultsSchema = z.object({
  credProps: z.object({ rk: z.boolean().optional() }).optional(),
});

const RegistrationResponseSchema = z.object({
  id: base64Url(ID_MAX_LENGTH),
  rawId: base64Url(ID_MAX_LENGTH),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(AUTHENTICATOR_ATTACHMENTS).optional(),
  clientExtensionResults: ClientExtensionResultsSchema,
  response: z.object({
    clientDataJSON: base64Url(ENCODED_MAX_LENGTH),
    attestationObject: base64Url(ENCODED_MAX_LENGTH),
    authenticatorData: base64Url(ENCODED_MAX_LENGTH).optional(),
    transports: z.array(z.enum(AUTHENTICATOR_TRANSPORTS)).optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    publicKey: base64Url(ENCODED_MAX_LENGTH).optional(),
  }),
});

const AuthenticationResponseSchema = z.object({
  id: base64Url(ID_MAX_LENGTH),
  rawId: base64Url(ID_MAX_LENGTH),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(AUTHENTICATOR_ATTACHMENTS).optional(),
  clientExtensionResults: ClientExtensionResultsSchema,
  response: z.object({
    clientDataJSON: base64Url(ENCODED_MAX_LENGTH),
    authenticatorData: base64Url(ENCODED_MAX_LENGTH),
    signature: base64Url(ENCODED_MAX_LENGTH),
    userHandle: base64Url(ID_MAX_LENGTH).optional(),
  }),
});

export const SetupOptionsSchema = z.strictObject({
  code: z.string().min(1).max(ID_MAX_LENGTH),
  name: DisplayNameSchema,
});

export const SetupVerifySchema = z.strictObject({
  code: z.string().min(1).max(ID_MAX_LENGTH),
  name: DisplayNameSchema,
  passkeyName: DisplayNameSchema.optional(),
  response: RegistrationResponseSchema,
});

export const SignInVerifySchema = z.strictObject({
  response: AuthenticationResponseSchema,
});

// Sign-in only checks the shape: a wrong length is just a wrong password, with the same answer as any other.
export const PasswordSignInSchema = z.strictObject({
  username: z.string().trim().min(1).max(USERNAME_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const SetPasswordSchema = z.strictObject({
  username: UsernameSchema,
  password: NewPasswordSchema,
});

export const AddPasskeyVerifySchema = z.strictObject({
  name: DisplayNameSchema,
  response: RegistrationResponseSchema,
});

export const PasskeyParamsSchema = z.object({ passkeyId: base64Url(ID_MAX_LENGTH) });

// `username` is null until the user sets a password.
const AuthUserSchema = z.object({ name: z.string(), username: z.string().nullable() });

export const AuthStatusResponseSchema = z
  .object({ state: z.enum(AUTH_STATES), user: AuthUserSchema.optional() })
  .meta({ id: 'AuthStatus' });

export const SignedInResponseSchema = z.object({ user: AuthUserSchema }).meta({ id: 'SignedIn' });

// The options objects are built by @simplewebauthn/server and passed straight to the browser library: only the
// challenge is pinned here, the rest passes through untouched.
export const RegistrationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyRegistrationOptions' });

export const AuthenticationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyAuthenticationOptions' });

export const PasskeyResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isSynced: z.boolean(),
    createdAt: z.iso.datetime(),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'Passkey' });

export const PasskeyListResponseSchema = z.object({ data: z.array(PasskeyResponseSchema) });

export type AuthState = (typeof AUTH_STATES)[number];
export type SetupOptions = z.infer<typeof SetupOptionsSchema>;
export type SetupVerify = z.infer<typeof SetupVerifySchema>;
export type SignInVerify = z.infer<typeof SignInVerifySchema>;
export type PasswordSignIn = z.infer<typeof PasswordSignInSchema>;
export type SetPassword = z.infer<typeof SetPasswordSchema>;
export type AddPasskeyVerify = z.infer<typeof AddPasskeyVerifySchema>;
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
export type SignedInResponse = z.infer<typeof SignedInResponseSchema>;
export type RegistrationOptionsResponse = z.infer<typeof RegistrationOptionsResponseSchema>;
export type AuthenticationOptionsResponse = z.infer<typeof AuthenticationOptionsResponseSchema>;
export type PasskeyResponse = z.infer<typeof PasskeyResponseSchema>;
export type PasskeyListResponse = z.infer<typeof PasskeyListResponseSchema>;
