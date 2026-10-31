import { mixed, object, type InferType } from 'yup';
import { UserRoleUtil } from '@app-types/utility';
import { usernameSchema } from '@utils/authUtils';

// The admin picks the username and the role; the API makes the temporary password.
export const CreateUserSchema = object({
  username: usernameSchema,
  role: mixed<UserRoleUtil>().oneOf(Object.values(UserRoleUtil)).required('Pick a role'),
});

export type CreateUser = InferType<typeof CreateUserSchema>;
