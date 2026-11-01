// The request schemas the submissions jobs share. What other modules share is in submissions.type.ts.
import { z } from 'zod';
import { IdParamSchema } from '../../lib/ids.ts';

export const SubmissionParamsSchema = z.object({
  funkoId: IdParamSchema,
});
