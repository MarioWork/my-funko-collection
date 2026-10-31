// The API's largest page: one member sends in a handful of funkos, so the list is not paged.
export const SUBMISSION_PAGE_SIZE = '100';

// "3 submissions" / "1 submission".
export function describeSubmissionCount(count: number): string {
  return count === 1 ? '1 submission' : `${count} submissions`;
}
