import { z } from 'zod';
import { AuthenticationResponseSchema, PASSWORD_MAX_LENGTH } from '../auth.schema.ts';
import { USERNAME_MAX_LENGTH } from '../auth.type.ts';

export const SignInVerifySchema = z.strictObject({
  response: AuthenticationResponseSchema,
});

// Sign-in only checks the shape: a wrong length is just a wrong password, with the same answer as any other.
export const PasswordSignInSchema = z.strictObject({
  username: z
    .string()
    .trim()
    .min(1)
    .max(USERNAME_MAX_LENGTH)
    .transform((username) => username.toLowerCase()),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

// Confirming it's you: only the signed-in user's password, never a username (the session says whose it must be).
export const ConfirmPasswordSchema = z.strictObject({
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

// Built by @simplewebauthn/server and passed straight to the browser library: only the challenge is pinned.
export const AuthenticationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyAuthenticationOptions' });

export type SignInVerify = z.infer<typeof SignInVerifySchema>;
export type PasswordSignIn = z.infer<typeof PasswordSignInSchema>;
export type ConfirmPassword = z.infer<typeof ConfirmPasswordSchema>;
export type AuthenticationOptionsResponse = z.infer<typeof AuthenticationOptionsResponseSchema>;
