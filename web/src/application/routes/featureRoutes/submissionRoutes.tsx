import type { RouteObject } from 'react-router';
import { SUBMISSION_ROUTES_PATHS } from '../routesUtils';

export const submissionRoutes: RouteObject[] = [
  {
    path: SUBMISSION_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/SubmissionList/SubmissionList.route'),
  },
  {
    path: SUBMISSION_ROUTES_PATHS.resend(),
    lazy: { action: async () => (await import('@pages/SubmissionList/submissionListActions')).resendSubmissionAction },
  },
  {
    path: SUBMISSION_ROUTES_PATHS.REVIEW,
    lazy: () => import('@pages/SubmissionReview/SubmissionReview.route'),
  },
  {
    path: SUBMISSION_ROUTES_PATHS.approve(),
    lazy: {
      action: async () => (await import('@pages/SubmissionReview/submissionReviewActions')).approveSubmissionAction,
    },
  },
  {
    path: SUBMISSION_ROUTES_PATHS.reject(),
    lazy: {
      action: async () => (await import('@pages/SubmissionReview/submissionReviewActions')).rejectSubmissionAction,
    },
  },
  {
    path: SUBMISSION_ROUTES_PATHS.merge(),
    lazy: {
      action: async () => (await import('@pages/SubmissionReview/submissionReviewActions')).mergeSubmissionAction,
    },
  },
];
