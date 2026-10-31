import { mixed, object, type InferType } from 'yup';
import { UserRoleUtil } from '@app-types/utility';
import { usernameSchema } from '@utils/authUtils';

// The admin picks the username and the role; the API makes the temporary password.
const userRoleSchema = mixed<UserRoleUtil>().oneOf(Object.values(UserRoleUtil)).required('Pick a role');

export const CreateUserSchema = object({
  username: usernameSchema,
  role: userRoleSchema,
});

// The only thing an admin changes on an existing user is their role.
export const UpdateUserSchema = object({
  role: userRoleSchema,
});

// A user with no username yet needs one to use the temporary password (the API answers 400 USERNAME_REQUIRED
// otherwise); one who has a username keeps it, and the request leaves it out.
export const NewTemporaryPasswordSchema = object({
  username: usernameSchema.optional(),
});

export type CreateUser = InferType<typeof CreateUserSchema>;
export type UpdateUser = InferType<typeof UpdateUserSchema>;
export type NewTemporaryPassword = InferType<typeof NewTemporaryPasswordSchema>;
