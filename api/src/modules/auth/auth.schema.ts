// The schemas the auth jobs share: the passkey shapes a browser sends, a display name, and the signed-in answer.
import { z } from 'zod';
import { USER_ROLES } from './auth.type.ts';

const NAME_MAX_LENGTH = 60;
export const PASSWORD_MAX_LENGTH = 256;
// Generous ceilings: real values are a few hundred bytes, these only stop absurd bodies early.
export const ID_MAX_LENGTH = 1024;
const ENCODED_MAX_LENGTH = 65_536;
const AUTHENTICATOR_TRANSPORTS = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'] as const;
const AUTHENTICATOR_ATTACHMENTS = ['platform', 'cross-platform'] as const;

export const base64Url = (maxLength: number) =>
  z
    .string()
    .min(1)
    .max(maxLength)
    .regex(/^[A-Za-z0-9_-]+$/, 'Must be base64url');

export const DisplayNameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

// What @simplewebauthn/browser sends back; the library checks the signed contents, this only checks the shape.
const ClientExtensionResultsSchema = z.object({
  credProps: z.object({ rk: z.boolean().optional() }).optional(),
});

export const RegistrationResponseSchema = z.object({
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

export const AuthenticationResponseSchema = z.object({
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

// `username` is null until the user sets a password. `mustChangePassword`: signed in with a temporary password, which
// must be replaced before anything else. `isReadOnly`: an admin limited this user to looking (every write but their
// own password, passkeys and signing out answers 403 READ_ONLY).
export const AuthUserSchema = z.object({
  name: z.string(),
  username: z.string().nullable(),
  role: z.enum(USER_ROLES),
  isReadOnly: z.boolean(),
  mustChangePassword: z.boolean(),
});

export const SignedInResponseSchema = z.object({ user: AuthUserSchema }).meta({ id: 'SignedIn' });

// The options objects are built by @simplewebauthn/server and passed straight to the browser library: only the
// challenge is pinned here, the rest passes through untouched.
export const RegistrationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyRegistrationOptions' });

export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;
export type AuthenticationResponse = z.infer<typeof AuthenticationResponseSchema>;
export type SignedInResponse = z.infer<typeof SignedInResponseSchema>;
export type RegistrationOptionsResponse = z.infer<typeof RegistrationOptionsResponseSchema>;
