import type { FunkoDetailApiModel } from '@app-types/models';
import SubmissionReviewNotes from '@components/SubmissionReviewNotes';
import SubmissionStatusBadge from '@components/SubmissionStatusBadge';
import { isOwnRejectedSubmission, isOwnWaitingSubmission } from '../funkoAccessUtils';
import { userNameOrRemoved } from '@utils/removedUserUtils';

type Props = {
  funko: FunkoDetailApiModel;
};

const WAITING_NOTE = 'Only you see it until an admin approves it.';
const REJECTED_NOTE = 'Still only yours. Fix it here, then send it again from Submissions, or delete it.';

// Where a submission stands, as a chip in words. Its sender reads that only they see it while it waits, or why it
// was rejected and what to do; an admin reads who sent it in ("Removed user" once that user was deleted). Both read
// when an admin changed it.
function SubmissionDetails({ funko }: Props) {
  const isOwnWaiting = isOwnWaitingSubmission(funko);
  const isOwnRejected = isOwnRejectedSubmission(funko);
  const hasSender = funko.submittedBy !== undefined;

  return (
    <span className="flex flex-col items-start gap-1">
      <SubmissionStatusBadge status={funko.status} />
      {isOwnWaiting ? <span className="text-xs text-muted-foreground">{WAITING_NOTE}</span> : null}
      {isOwnRejected ? <span className="text-xs text-muted-foreground">{REJECTED_NOTE}</span> : null}
      <SubmissionReviewNotes
        rejectionReason={funko.rejectionReason}
        changedByAdminAt={funko.changedByAdminAt}
        mergedInto={funko.mergedInto}
      />
      {hasSender ? (
        <span className="text-xs text-muted-foreground">Sent in by {userNameOrRemoved(funko.submittedBy ?? null)}</span>
      ) : null}
    </span>
  );
}

export default SubmissionDetails;
