import { z } from 'zod';
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

export const ListUsersQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(USER_SORT_FIELDS).default('USERNAME'),
});

export const UserResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    username: z.string().nullable(),
    role: z.enum(USER_ROLES),
    state: z.enum(USER_STATES),
    // When the temporary password stops working, while the user has one.
    temporaryPasswordExpiresAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

export const UserListResponseSchema = paginatedResponseSchema(UserResponseSchema);

// The only answer that ever carries the temporary password: the admin copies it now or never.
export const CreatedUserResponseSchema = z
  .object({ user: UserResponseSchema, temporaryPassword: z.string() })
  .meta({ id: 'CreatedUser' });

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type CreatedUserResponse = z.infer<typeof CreatedUserResponseSchema>;
