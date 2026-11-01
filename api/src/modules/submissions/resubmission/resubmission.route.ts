import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { signedInUser } from '../../../plugins/auth.plugin.ts';
import { SubmissionParamsSchema } from '../submissions.schema.ts';
import { SubmissionResponseSchema } from '../submissions.type.ts';
import { resendSubmission } from './resubmission.service.ts';

const TAGS = ['submissions'];

export const resubmissionRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/:funkoId/resubmission',
    {
      schema: {
        tags: TAGS,
        summary: 'Send a rejected submission in again (its sender)',
        params: SubmissionParamsSchema,
        response: {
          200: SubmissionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => resendSubmission(signedInUser(request), request.params.funkoId),
  );
};
