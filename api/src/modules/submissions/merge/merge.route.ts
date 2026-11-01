import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { SubmissionParamsSchema } from '../submissions.schema.ts';
import { SubmissionResponseSchema } from '../submissions.type.ts';
import { MergeSubmissionSchema } from './merge.schema.ts';
import { mergeSubmission } from './merge.service.ts';

const TAGS = ['submissions'];

export const mergeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/:funkoId/merge',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary:
          'Merge a waiting submission into a funko already in the catalogue: its items move there, and the catalogue funko takes the picked fields and images (400 when the target is not in the catalogue or a pick does not fit, 409 when a picked barcode or identity clashes with the catalogue)',
        params: SubmissionParamsSchema,
        body: MergeSubmissionSchema,
        response: {
          200: SubmissionResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => mergeSubmission(request.params.funkoId, request.body),
  );
};
