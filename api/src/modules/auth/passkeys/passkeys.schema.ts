import { z } from 'zod';
import { DisplayNameSchema, ID_MAX_LENGTH, RegistrationResponseSchema, base64Url } from '../auth.schema.ts';

export const AddPasskeyVerifySchema = z.strictObject({
  name: DisplayNameSchema,
  response: RegistrationResponseSchema,
});

export const PasskeyParamsSchema = z.object({ passkeyId: base64Url(ID_MAX_LENGTH) });

export const PasskeyResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isSynced: z.boolean(),
    createdAt: z.iso.datetime(),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'Passkey' });

export const PasskeyListResponseSchema = z.object({ data: z.array(PasskeyResponseSchema) });

export type AddPasskeyVerify = z.infer<typeof AddPasskeyVerifySchema>;
export type PasskeyResponse = z.infer<typeof PasskeyResponseSchema>;
export type PasskeyListResponse = z.infer<typeof PasskeyListResponseSchema>;
