// The schemas the users jobs share: a user as the API answers with them.
import { z } from 'zod';
import { USER_ROLES } from '../auth/auth.type.ts';

// How a user can sign in today:
// ACTIVE                      their own password or a passkey
// TEMPORARY_PASSWORD          only the temporary password an admin made, not replaced yet
// TEMPORARY_PASSWORD_EXPIRED  that temporary password went unused for 7 days
// NO_SIGN_IN                  no way in (the seed's user before setup, or everyone after yarn auth:reset)
export const USER_STATES = ['ACTIVE', 'TEMPORARY_PASSWORD', 'TEMPORARY_PASSWORD_EXPIRED', 'NO_SIGN_IN'] as const;
export type UserState = (typeof USER_STATES)[number];

export const UserResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    username: z.string().nullable(),
    role: z.enum(USER_ROLES),
    // Limited to looking: signs in and reads, changes only their own password and passkeys.
    isReadOnly: z.boolean(),
    state: z.enum(USER_STATES),
    // When the temporary password stops working, while the user has one.
    temporaryPasswordExpiresAt: z.iso.datetime().nullable(),
    // The only admin left who is not read-only: they can't be made a member, made read-only or deleted, so there is
    // always at least one admin who can change things.
    isLastAdmin: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

// The only answers that ever carry a temporary password (a new user, or a new temporary password for a user who
// forgot theirs): the admin copies it now or never.
export const UserWithTemporaryPasswordResponseSchema = z
  .object({ user: UserResponseSchema, temporaryPassword: z.string() })
  .meta({ id: 'UserWithTemporaryPassword' });

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserWithTemporaryPasswordResponse = z.infer<typeof UserWithTemporaryPasswordResponseSchema>;
