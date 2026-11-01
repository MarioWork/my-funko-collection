import type { ReviewSubmissionApiModel } from '@app-types/models';
import SubmissionReviewNotes from '@components/SubmissionReviewNotes';
import SubmissionStatusBadge from '@components/SubmissionStatusBadge';
import { formatDate } from '@utils/dateUtils';

type Props = {
  submission: ReviewSubmissionApiModel;
};

// What became of a reviewed submission: the state in words, when, and the reason the member read or the funko it was
// merged into.
function ReviewOutcome({ submission }: Props) {
  return (
    <div className="flex flex-col items-end gap-1 text-left">
      <SubmissionStatusBadge status={submission.status} />
      {submission.reviewedAt ? (
        <span className="text-xs text-muted-foreground tabular-nums">{formatDate(submission.reviewedAt)}</span>
      ) : null}
      <SubmissionReviewNotes rejectionReason={submission.rejectionReason} mergedInto={submission.mergedInto} />
    </div>
  );
}

export default ReviewOutcome;
