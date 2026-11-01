import { z } from 'zod';
import { IdParamSchema } from '../../../lib/ids.ts';
import { USER_ROLES, UsernameSchema } from '../../auth/auth.type.ts';

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

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type NewTemporaryPassword = z.infer<typeof NewTemporaryPasswordSchema>;
