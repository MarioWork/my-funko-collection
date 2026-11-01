import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { ApiError, SubmissionApiModel, SubmissionId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useActionToast } from '@hooks/useActionToast';

// Sending a rejected submission again, owned by the list: the row's button goes away once it waits again, before
// its own fetcher would settle, so the toast and any error live here.
export function useResendSubmission() {
  const fetcher = useFetcher<JSONResponseUtil<SubmissionApiModel>>();
  const [pending, setPending] = useState<SubmissionApiModel | null>(null);
  const isBusy = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isBusy ? fetcher.data.error : undefined;

  useActionToast(fetcher, { successMessage: () => `${pending?.name ?? 'Submission'} sent again` });

  const resend = (submission: SubmissionApiModel) => {
    setPending(submission);
    void fetcher.submit(null, {
      method: HttpVerbsUtil.POST,
      action: SUBMISSION_ROUTES_PATHS.resend(String(submission.id)),
    });
  };

  const failureOf = (id: SubmissionId): ApiError | undefined => (pending?.id === id ? failure : undefined);

  return { busyId: isBusy ? pending?.id : undefined, isBusy, resend, failureOf };
}
