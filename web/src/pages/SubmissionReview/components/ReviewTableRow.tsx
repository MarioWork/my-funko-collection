import { Link } from 'react-router';
import type { ReviewSubmissionApiModel } from '@app-types/models';
import { SubmissionStatusUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { TableCell, TableRow } from '@components/ui/table';
import { formatDate } from '@utils/dateUtils';
import { userNameOrRemoved } from '@utils/removedUserUtils';
import { TABLE_ROW_LINK_CLASS } from '@utils/tableUtils';
import PossibleDoubles from './PossibleDoubles';
import ReviewActions from './ReviewActions';
import ReviewOutcome from './ReviewOutcome';

type Props = {
  submission: ReviewSubmissionApiModel;
};

const THUMB_SIZES = '40px';

// "#78 · Pop! Marvel · from luke · 3 Jan 2026", and "sent again" once it was rejected before.
function describeSubmission(submission: ReviewSubmissionApiModel): string {
  const isResent = submission.status === SubmissionStatusUtil.WAITING && submission.reviewedAt !== null;
  const parts = [
    `#${submission.number}`,
    submission.category.name,
    `from ${userNameOrRemoved(submission.submittedBy)}`,
    formatDate(submission.createdAt),
  ];

  if (isResent) parts.push('sent again');

  return parts.join(' · ');
}

// The funko's name opens its page, where an admin can fix a typo or a photo before approving it.
function ReviewTableRow({ submission }: Props) {
  const isWaiting = submission.status === SubmissionStatusUtil.WAITING;

  return (
    <TableRow className="align-top">
      <TableCell className="w-12">
        <FunkoImage image={submission.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-9 rounded-md" />
      </TableCell>
      <TableCell className="max-w-0 min-w-40 whitespace-normal">
        <Link viewTransition to={FUNKO_ROUTES_PATHS.detail(String(submission.id))} className={TABLE_ROW_LINK_CLASS}>
          {submission.name}
        </Link>
        <p className="text-xs text-muted-foreground">{describeSubmission(submission)}</p>
        <PossibleDoubles doubles={submission.possibleDoubles} />
      </TableCell>
      <TableCell className="text-right whitespace-normal">
        {isWaiting ? <ReviewActions submission={submission} /> : <ReviewOutcome submission={submission} />}
      </TableCell>
    </TableRow>
  );
}

export default ReviewTableRow;
