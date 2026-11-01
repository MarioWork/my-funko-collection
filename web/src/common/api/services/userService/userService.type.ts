import { boolean, mixed, object, type InferType } from 'yup';
import { UserRoleUtil } from '@app-types/utility';
import { usernameSchema } from '@utils/authUtils';

// The admin picks the username and the role; the API makes the temporary password.
const userRoleSchema = mixed<UserRoleUtil>().oneOf(Object.values(UserRoleUtil)).required('Pick a role');

export const CreateUserSchema = object({
  username: usernameSchema,
  role: userRoleSchema,
});

const UPDATE_USER_EMPTY_MESSAGE = 'Pick a role or whether they are read-only';

// What an admin changes on an existing user: their role, whether they are read-only (limited to looking), or both.
export const UpdateUserSchema = object({
  role: mixed<UserRoleUtil>().oneOf(Object.values(UserRoleUtil)).optional(),
  isReadOnly: boolean().optional(),
}).test(
  'role-or-read-only',
  UPDATE_USER_EMPTY_MESSAGE,
  (change) => change.role !== undefined || change.isReadOnly !== undefined,
);

// A user with no username yet needs one to use the temporary password (the API answers 400 USERNAME_REQUIRED
// otherwise); one who has a username keeps it, and the request leaves it out.
export const CreateTemporaryPasswordSchema = object({
  username: usernameSchema.optional(),
});

export type CreateUser = InferType<typeof CreateUserSchema>;
export type UpdateUser = InferType<typeof UpdateUserSchema>;
export type CreateTemporaryPassword = InferType<typeof CreateTemporaryPasswordSchema>;
