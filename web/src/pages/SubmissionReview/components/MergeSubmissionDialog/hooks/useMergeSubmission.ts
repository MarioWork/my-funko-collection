import { useFetcher } from 'react-router';
import type { FunkoDetailApiModel, SubmissionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { createFormData } from '@utils/formDataUtils';

// The dialog's own write: posts the merge to its route's action, says so in a toast and closes once it worked. A
// refusal (a barcode another funko has, too many images) stays in the dialog, in the API's words.
export function useMergeSubmission(submission: FunkoDetailApiModel, onMerged: () => void) {
  const fetcher = useFetcher<JSONResponseUtil<SubmissionApiModel>>();
  const isSaving = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isSaving ? fetcher.data.error : undefined;

  useActionToast(fetcher, { successMessage: `${submission.name} merged` });
  useCloseOnSuccess(fetcher, onMerged);

  const merge = (choices: MergeSubmission) => {
    void fetcher.submit(createFormData({ merge: choices }), {
      method: HttpVerbsUtil.POST,
      action: SUBMISSION_ROUTES_PATHS.merge(String(submission.id)),
    });
  };

  return { isSaving, failure, merge };
}
