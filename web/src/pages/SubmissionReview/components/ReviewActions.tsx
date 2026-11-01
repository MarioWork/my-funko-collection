import { Check, CopyCheck, Merge, X } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiError, ReviewSubmissionApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import InlineAlert from '@components/InlineAlert';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { useReviewActionsContext } from '../hooks/useReviewActionsContext';
import { detectedMergeLinkOf } from '../submissionReviewUtils';

type Props = {
  submission: ReviewSubmissionApiModel;
};

const MARK_DOUBLE_LABEL = 'This is a double of…';

type FailureProps = {
  failure: ApiError;
};

// The API's words, and a link to the catalogue funko it clashes with when there is one.
function ApproveFailure({ failure }: FailureProps) {
  return (
    <InlineAlert tone="error" className="text-left">
      {failure.message ?? GENERIC_WRITE_ERROR}{' '}
      {failure.existingId ? (
        <Link to={FUNKO_ROUTES_PATHS.detail(String(failure.existingId))} className="font-medium underline">
          Open the catalogue’s funko
        </Link>
      ) : null}
    </InlineAlert>
  );
}

// One review at a time: while one is saving, every row's buttons wait. A read-only admin only looks.
function ReviewButtons({ submission }: Props) {
  const { busyId, isBusy, approve, openReject } = useReviewActionsContext();
  // The other way in: the admin marks any waiting submission as a double by hand and searches the catalogue.
  const markDoubleLink = SUBMISSION_ROUTES_PATHS.mergeInto(String(submission.id));
  const detectedMergeLink = detectedMergeLinkOf(submission);
  const isApproving = busyId === submission.id;
  const disabledReason = firstReason(useReadOnlyReason(), reasonWhen(isBusy, DISABLED_REASONS.WORKING));
  const isDisabled = disabledReason !== undefined;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <DisabledReason reason={disabledReason}>
        <Button variant="outline" size="sm" onClick={() => openReject(submission)} disabled={isDisabled}>
          <X data-icon="inline-start" aria-hidden="true" />
          Reject
        </Button>
      </DisabledReason>
      <LinkButton variant="outline" size="sm" to={markDoubleLink} disabledReason={disabledReason}>
        <CopyCheck data-icon="inline-start" aria-hidden="true" />
        {MARK_DOUBLE_LABEL}
      </LinkButton>
      {detectedMergeLink ? (
        <LinkButton variant="outline" size="sm" to={detectedMergeLink} disabledReason={disabledReason}>
          <Merge data-icon="inline-start" aria-hidden="true" />
          Merge
        </LinkButton>
      ) : null}
      <DisabledReason reason={disabledReason}>
        <Button size="sm" onClick={() => approve(submission)} disabled={isDisabled}>
          {isApproving ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" aria-hidden="true" />}
          Approve
        </Button>
      </DisabledReason>
    </div>
  );
}

// Approve, reject or merge (into a catalogue funko it is the same as) one waiting submission. Approving is not
// undoable but asks nothing: the admin opens the funko to check it first when they want to. A refusal (the catalogue
// already has it) shows here. Merge links to its routed dialog.
function ReviewActions({ submission }: Props) {
  const { approveFailureOf } = useReviewActionsContext();
  const failure = approveFailureOf(submission.id);

  return (
    <div className="flex flex-col items-end gap-2">
      <ReviewButtons submission={submission} />
      {failure ? <ApproveFailure failure={failure} /> : null}
    </div>
  );
}

export default ReviewActions;
