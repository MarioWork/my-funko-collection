import { z } from 'zod';
import { PASSWORD_MAX_LENGTH } from '../auth.schema.ts';
import { UsernameSchema } from '../auth.type.ts';

// NIST SP 800-63B-4: at least 15 characters for a password used on its own, and room for long passphrases.
export const PASSWORD_MIN_LENGTH = 15;

// Never trimmed: every character typed is part of the password. No character-mix rules.
const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH);

export const SetPasswordSchema = z.strictObject({
  username: UsernameSchema,
  password: NewPasswordSchema,
});

export type SetPassword = z.infer<typeof SetPasswordSchema>;
