// What other modules may import from auth (node-ts-api §3): the roles and the username rule the users module
// shares. Everything else stays in auth.schema.ts.
import { z } from 'zod';

// Matches the `UserRole` enum in prisma/schema.prisma; auth.repository.ts fails to compile if either side gains a
// role the other lacks.
export const USER_ROLES = ['ADMIN', 'MEMBER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Who is calling a route, as a service needs it to decide what they may see and change.
export type SignedInUser = {
  userId: number;
  isAdmin: boolean;
};

const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;

// Letters, digits, dot, dash and underscore; compared and stored lower-case, so "Mario" signs in as "mario".
export const UsernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(/^[A-Za-z0-9._-]+$/, 'Use letters, digits, dots, dashes or underscores')
  .transform((username) => username.toLowerCase());
