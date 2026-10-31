import type { RouteObject } from 'react-router';
import { SUBMISSION_ROUTES_PATHS } from '../routesUtils';

export const submissionRoutes: RouteObject[] = [
  {
    path: SUBMISSION_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/SubmissionList/SubmissionList.route'),
  },
];
