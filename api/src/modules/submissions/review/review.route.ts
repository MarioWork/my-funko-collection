import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../../lib/errorHandler.ts';
import { SubmissionParamsSchema } from '../submissions.schema.ts';
import { SubmissionResponseSchema } from '../submissions.type.ts';
import { ListReviewQuerySchema, RejectSubmissionSchema, ReviewSubmissionListResponseSchema } from './review.schema.ts';
import { approveSubmission, getReviewSubmissions, rejectSubmission } from './review.service.ts';

const TAGS = ['submissions'];

export const reviewRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/review',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary: "Every member's submissions for the admins: WAITING (oldest first) or DONE (last reviewed first)",
        querystring: ListReviewQuerySchema,
        response: { 200: ReviewSubmissionListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getReviewSubmissions(request.query),
  );

  app.post(
    '/:funkoId/approval',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary: 'Approve a waiting submission: the funko joins the catalogue (409 when it clashes with the catalogue)',
        params: SubmissionParamsSchema,
        response: {
          200: SubmissionResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => approveSubmission(request.params.funkoId),
  );

  app.post(
    '/:funkoId/rejection',
    {
      config: { isAdminOnly: true },
      schema: {
        tags: TAGS,
        summary:
          'Reject a waiting submission with a reason its sender reads (204: an orphan submission, which is deleted)',
        params: SubmissionParamsSchema,
        body: RejectSubmissionSchema,
        response: {
          200: SubmissionResponseSchema,
          204: z.undefined(),
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const outcome = await rejectSubmission(request.params.funkoId, request.body.reason);

      if (outcome.isDeleted) return reply.code(204).send();

      return outcome.submission;
    },
  );
};
