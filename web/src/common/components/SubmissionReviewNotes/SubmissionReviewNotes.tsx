import { Link } from 'react-router';
import type { NamedApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { formatDate } from '@utils/dateUtils';
import { CHANGED_BY_ADMIN_NOTE } from '@utils/submissionUtils';

type Props = {
  // Why an admin rejected it; null or left out when it is not rejected.
  rejectionReason?: string | null;
  // When an admin last changed it; null or left out when no admin did.
  changedByAdminAt?: string | null;
  // The catalogue funko it was merged into; null or left out when it was not (or that funko is gone).
  mergedInto?: NamedApiModel | null;
};

const MERGED_INTO_LABEL = 'Merged into';
const LINK_CLASS =
  'font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring';

// What the sender (and an admin) reads about a submission's review: why it was rejected, which catalogue funko it
// was merged into (a link: their items are there now), and that an admin changed it. Nothing when there is nothing
// to say.
function SubmissionReviewNotes({ rejectionReason, changedByAdminAt, mergedInto }: Props) {
  if (!rejectionReason && !changedByAdminAt && !mergedInto) return null;

  return (
    <span className="flex flex-col gap-0.5 text-xs">
      {rejectionReason ? (
        <span className="text-destructive">
          <span className="font-medium">Why it was rejected:</span> {rejectionReason}
        </span>
      ) : null}
      {mergedInto ? (
        <span className="text-muted-foreground">
          {MERGED_INTO_LABEL}{' '}
          <Link viewTransition to={FUNKO_ROUTES_PATHS.detail(String(mergedInto.id))} className={LINK_CLASS}>
            {mergedInto.name}
          </Link>
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
