// The request schemas the funkos jobs share. What other modules share is in funkos.type.ts.
import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';

export const FunkoParamsSchema = z.object({
  funkoId: IdParamSchema,
});
