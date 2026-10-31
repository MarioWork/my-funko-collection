import { DEFAULT_FIRST_PAGE } from '@app-types/utility';
import submissionService, {
  DEFAULT_SUBMISSION_SORT_DIRECTION,
  DEFAULT_SUBMISSION_SORT_FIELD,
} from '@services/submissionService/submissionService';
import { SUBMISSION_PAGE_SIZE } from './submissionListUtils';

// What the signed-in user sent in, newest first: one page of the API's largest size.
export async function loader() {
  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: SUBMISSION_PAGE_SIZE },
    sortingField: DEFAULT_SUBMISSION_SORT_FIELD,
    direction: DEFAULT_SUBMISSION_SORT_DIRECTION,
  };

  const submissionsResponse = await submissionService.getSubmissions(fields);

  return { submissionsResponse };
}
