import { z } from 'zod';
import { AuthUserSchema } from '../auth.schema.ts';

export const AUTH_STATES = ['setup', 'signedOut', 'signedIn'] as const;

export const AuthStatusResponseSchema = z
  .object({ state: z.enum(AUTH_STATES), user: AuthUserSchema.optional() })
  .meta({ id: 'AuthStatus' });

export type AuthState = (typeof AUTH_STATES)[number];
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
