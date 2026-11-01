import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../../lib/pagination.ts';
import { USER_ROLES, UsernameSchema } from '../../auth/auth.type.ts';
import { UserResponseSchema } from '../users.schema.ts';

export const USER_SORT_FIELDS = ['USERNAME', 'NAME', 'CREATION_DATE'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

// The admin picks the username and the role; the app makes the temporary password.
export const CreateUserSchema = z.strictObject({
  username: UsernameSchema,
  role: z.enum(USER_ROLES),
});

export const ListUsersQuerySchema = PaginationQuerySchema.extend({
  sorting_fields: z.enum(USER_SORT_FIELDS).default('USERNAME'),
});

export const UserListResponseSchema = paginatedResponseSchema(UserResponseSchema);

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
