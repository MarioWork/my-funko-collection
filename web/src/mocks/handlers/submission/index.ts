import listReviewSubmissionsHandler from './listReviewSubmissions.mock.handler';
import listSubmissionsHandler from './listSubmissions.mock.handler';
import mergeSubmissionHandler from './mergeSubmission.mock.handler';
import reviewSubmissionHandler from './reviewSubmission.mock.handler';

// The review list first: /submissions/review must not be taken for something else.
export const submissionMockHandlers = (baseUrl: string) => [
  ...listReviewSubmissionsHandler(baseUrl),
  ...listSubmissionsHandler(baseUrl),
  ...reviewSubmissionHandler(baseUrl),
  ...mergeSubmissionHandler(baseUrl),
];
