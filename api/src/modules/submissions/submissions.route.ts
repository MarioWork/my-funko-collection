import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { ErrorResponseSchema } from '../../lib/errorHandler.ts';
import { signedInUser, signedInUserId } from '../../plugins/auth.plugin.ts';
import { RejectSubmissionSchema, SubmissionParamsSchema } from './submissions.schema.ts';
import {
  approveSubmission,
  getReviewSubmissions,
  getSubmissions,
  rejectSubmission,
  resendSubmission,
} from './submissions.service.ts';
import {
  ListReviewQuerySchema,
  ListSubmissionsQuerySchema,
  ReviewSubmissionListResponseSchema,
  SubmissionListResponseSchema,
  SubmissionResponseSchema,
} from './submissions.type.ts';

const TAGS = ['submissions'];

export const submissionsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      prefixTrailingSlash: 'no-slash',
      schema: {
        tags: TAGS,
        summary: 'List the funkos the signed-in user sent in, with where each stands',
        querystring: ListSubmissionsQuerySchema,
        response: { 200: SubmissionListResponseSchema, 400: ErrorResponseSchema },
      },
    },
    async (request) => getSubmissions(signedInUserId(request), request.query),
  );

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
        summary: 'Reject a waiting submission with a reason its sender reads',
        params: SubmissionParamsSchema,
        body: RejectSubmissionSchema,
        response: {
          200: SubmissionResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => rejectSubmission(request.params.funkoId, request.body.reason),
  );

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
