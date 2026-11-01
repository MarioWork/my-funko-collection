import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { ApiError, ReviewSubmissionApiModel, SubmissionApiModel, SubmissionId } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData } from '@utils/formDataUtils';
import type { RejectSubmissionFormValues } from '../submissionReviewUtils';

type ReviewKind = 'approve' | 'reject';

type Pending = { kind: ReviewKind; submission: ReviewSubmissionApiModel };

const SUCCESS_MESSAGE_MAP: Record<ReviewKind, (name: string) => string> = {
  approve: (name) => `${name} approved`,
  reject: (name) => `${name} rejected`,
};

// Approve and reject for the whole Waiting list, owned by the list: a reviewed row leaves the tab before its own
// fetcher would settle, so the toast and the error must live in something that stays on screen. The reject dialog
// is opened from here too, for the same reason.
export function useReviewActions() {
  const fetcher = useFetcher<JSONResponseUtil<SubmissionApiModel>>();
  const [pending, setPending] = useState<Pending | null>(null);
  const [rejecting, setRejecting] = useState<ReviewSubmissionApiModel | null>(null);
  const isBusy = fetcher.state !== 'idle';
  const busyId = isBusy ? pending?.submission.id : undefined;
  const failure = fetcher.data?.success === false && !isBusy ? fetcher.data.error : undefined;

  useActionToast(fetcher, {
    successMessage: () => (pending ? SUCCESS_MESSAGE_MAP[pending.kind](pending.submission.name) : 'Done'),
  });

  const approve = (submission: ReviewSubmissionApiModel) => {
    setPending({ kind: 'approve', submission });
    void fetcher.submit(null, {
      method: HttpVerbsUtil.POST,
      action: SUBMISSION_ROUTES_PATHS.approve(String(submission.id)),
    });
  };

  const reject = (submission: ReviewSubmissionApiModel, rejection: RejectSubmissionFormValues) => {
    setPending({ kind: 'reject', submission });
    void fetcher.submit(createFormData({ rejection }), {
      method: HttpVerbsUtil.POST,
      action: SUBMISSION_ROUTES_PATHS.reject(String(submission.id)),
    });
  };

  // Why the last approval of this row failed; a failed rejection shows in the dialog instead.
  const approveFailureOf = (id: SubmissionId): ApiError | undefined => {
    const isThisApproval = pending?.kind === 'approve' && pending.submission.id === id;

    return isThisApproval ? failure : undefined;
  };

  const rejectFailure = pending?.kind === 'reject' ? failure : undefined;

  return {
    fetcher,
    busyId,
    isBusy,
    rejecting,
    rejectFailure,
    approve,
    reject,
    approveFailureOf,
    openReject: setRejecting,
    closeReject: () => setRejecting(null),
  };
}
