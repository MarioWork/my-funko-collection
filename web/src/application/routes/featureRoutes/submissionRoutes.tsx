import type { RouteObject } from 'react-router';
import { SUBMISSION_REVIEW_ROUTE_ID, SUBMISSION_ROUTES_PATHS } from '../routesUtils';

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
    id: SUBMISSION_REVIEW_ROUTE_ID,
    path: SUBMISSION_ROUTES_PATHS.REVIEW,
    lazy: () => import('@pages/SubmissionReview/SubmissionReview.route'),
    children: [
      {
        path: SUBMISSION_ROUTES_PATHS.merge(),
        lazy: () => import('@pages/SubmissionReview/components/MergeSubmissionDialog/MergeSubmissionDialog.route'),
      },
    ],
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
];
