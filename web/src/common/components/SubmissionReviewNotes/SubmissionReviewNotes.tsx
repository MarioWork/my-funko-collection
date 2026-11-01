import { formatDate } from '@utils/dateUtils';
import { CHANGED_BY_ADMIN_NOTE } from '@utils/submissionUtils';

type Props = {
  // Why an admin rejected it; null or left out when it is not rejected.
  rejectionReason?: string | null;
  // When an admin last changed it; null or left out when no admin did.
  changedByAdminAt?: string | null;
};

// What the sender (and an admin) reads about a submission's review: why it was rejected, and that an admin changed
// it. Nothing when there is nothing to say.
function SubmissionReviewNotes({ rejectionReason, changedByAdminAt }: Props) {
  if (!rejectionReason && !changedByAdminAt) return null;

  return (
    <span className="flex flex-col gap-0.5 text-xs">
      {rejectionReason ? (
        <span className="text-destructive">
          <span className="font-medium">Why it was rejected:</span> {rejectionReason}
        </span>
      ) : null}
      {changedByAdminAt ? (
        <span className="text-muted-foreground">
          {CHANGED_BY_ADMIN_NOTE} ({formatDate(changedByAdminAt)})
        </span>
      ) : null}
    </span>
  );
}

export default SubmissionReviewNotes;
