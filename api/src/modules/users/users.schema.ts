import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';
import { USER_ROLES, UsernameSchema } from '../auth/auth.type.ts';

export const USER_SORT_FIELDS = ['USERNAME', 'NAME', 'CREATION_DATE'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

// How a user can sign in today:
// ACTIVE                      their own password or a passkey
// TEMPORARY_PASSWORD          only the temporary password an admin made, not replaced yet
// TEMPORARY_PASSWORD_EXPIRED  that temporary password went unused for 7 days
// NO_SIGN_IN                  no way in (the seed's user before setup, or everyone after yarn auth:reset)
export const USER_STATES = ['ACTIVE', 'TEMPORARY_PASSWORD', 'TEMPORARY_PASSWORD_EXPIRED', 'NO_SIGN_IN'] as const;
export type UserState = (typeof USER_STATES)[number];

// The admin picks the username and the role; the app makes the temporary password.
export const CreateUserSchema = z.strictObject({
  username: UsernameSchema,
  role: z.enum(USER_ROLES),
});

export const UserParamsSchema = z.object({
  userId: IdParamSchema,
});

const UPDATE_USER_EMPTY_MESSAGE = 'Send a role, isReadOnly or both';

// What an admin changes on an existing user: their role, and whether they are read-only (limited to looking).
// At least one of the two.
export const UpdateUserSchema = z
  .strictObject({
    role: z.enum(USER_ROLES).optional(),
    isReadOnly: z.boolean().optional(),
  })
  .refine((change) => change.role !== undefined || change.isReadOnly !== undefined, UPDATE_USER_EMPTY_MESSAGE);

// A user with no username yet (signed in with a passkey only, or after yarn auth:reset) needs one to use the
// temporary password: the admin picks it here. A user who has one keeps it (another one answers 400).
export const NewTemporaryPasswordSchema = z.strictObject({
  username: UsernameSchema.optional(),
});

export const ListUsersQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(USER_SORT_FIELDS).default('USERNAME'),
});

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

export const UserListResponseSchema = paginatedResponseSchema(UserResponseSchema);

// The only answers that ever carry a temporary password (a new user, or a new temporary password for a user who
// forgot theirs): the admin copies it now or never.
export const UserWithTemporaryPasswordResponseSchema = z
  .object({ user: UserResponseSchema, temporaryPassword: z.string() })
  .meta({ id: 'UserWithTemporaryPassword' });

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type NewTemporaryPassword = z.infer<typeof NewTemporaryPasswordSchema>;
export type UserWithTemporaryPasswordResponse = z.infer<typeof UserWithTemporaryPasswordResponseSchema>;
