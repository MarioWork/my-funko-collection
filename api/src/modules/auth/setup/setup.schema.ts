import { z } from 'zod';
import { DisplayNameSchema, ID_MAX_LENGTH, RegistrationResponseSchema } from '../auth.schema.ts';

export const SetupOptionsSchema = z.strictObject({
  code: z.string().min(1).max(ID_MAX_LENGTH),
  name: DisplayNameSchema,
});

export const SetupVerifySchema = z.strictObject({
  code: z.string().min(1).max(ID_MAX_LENGTH),
  name: DisplayNameSchema,
  passkeyName: DisplayNameSchema.optional(),
  response: RegistrationResponseSchema,
});

export type SetupOptions = z.infer<typeof SetupOptionsSchema>;
export type SetupVerify = z.infer<typeof SetupVerifySchema>;
