import type { FunkoDetailApiModel } from '@app-types/models';
import SubmissionStatusBadge from '@components/SubmissionStatusBadge';
import { isOwnWaitingSubmission } from '@utils/funkoAccessUtils';
import { userNameOrRemoved } from '@utils/removedUserUtils';

type Props = {
  funko: FunkoDetailApiModel;
};

const SUBMISSION_NOTE = 'Only you see it until an admin approves it.';

// Where a submission stands, as a chip in words. Its sender reads that only they see it while it waits; an admin
// reads who sent it in ("Removed user" once that user was deleted).
function SubmissionDetails({ funko }: Props) {
  const isOwnWaiting = isOwnWaitingSubmission(funko);
  const hasSender = funko.submittedBy !== undefined;

  return (
    <span className="flex flex-col items-start gap-1">
      <SubmissionStatusBadge status={funko.status} />
      {isOwnWaiting ? <span className="text-xs text-muted-foreground">{SUBMISSION_NOTE}</span> : null}
      {hasSender ? (
        <span className="text-xs text-muted-foreground">Sent in by {userNameOrRemoved(funko.submittedBy ?? null)}</span>
      ) : null}
    </span>
  );
}

export default SubmissionDetails;
