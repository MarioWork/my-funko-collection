import { Link } from 'react-router';
import type { SubmissionApiModel } from '@app-types/models';
import { SubmissionStatusUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import SubmissionReviewNotes from '@components/SubmissionReviewNotes';
import SubmissionStatusBadge from '@components/SubmissionStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { formatDate } from '@utils/dateUtils';
import { TABLE_HEADER_ROW_CLASS, TABLE_ROW_LINK_CLASS } from '@utils/tableUtils';
import { useResendSubmission } from '../hooks/useResendSubmission';
import ResendSubmissionButton from './ResendSubmissionButton';

type Props = {
  submissions: SubmissionApiModel[];
};

type ResendActions = ReturnType<typeof useResendSubmission>;

type RowProps = {
  submission: SubmissionApiModel;
  resendActions: ResendActions;
};

const THUMB_SIZES = '40px';

// The funko's name links to its page, where a waiting or rejected one can still be edited or deleted. The state is a
// chip in words, with why it was rejected and whether an admin changed it; a rejected one can be sent again here.
function SubmissionTableRow({ submission, resendActions }: RowProps) {
  const isRejected = submission.status === SubmissionStatusUtil.REJECTED;
  const { busyId, isBusy, resend, failureOf } = resendActions;

  return (
    <TableRow className="align-top">
      <TableCell className="w-12">
        <FunkoImage image={submission.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-9 rounded-md" />
      </TableCell>
      <TableCell className="max-w-0 min-w-40 whitespace-normal">
        <Link viewTransition to={FUNKO_ROUTES_PATHS.detail(String(submission.id))} className={TABLE_ROW_LINK_CLASS}>
          {submission.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          #{submission.number} · {submission.category.name}
        </p>
        <SubmissionReviewNotes
          rejectionReason={submission.rejectionReason}
          changedByAdminAt={submission.changedByAdminAt}
        />
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="flex flex-col items-start gap-2">
          <SubmissionStatusBadge status={submission.status} />
          {isRejected ? (
            <ResendSubmissionButton
              isSending={busyId === submission.id}
              isBusy={isBusy}
              failure={failureOf(submission.id)}
              onResend={() => resend(submission)}
            />
          ) : null}
        </div>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">
        {formatDate(submission.createdAt)}
      </TableCell>
    </TableRow>
  );
}

// The image column has a name for screen readers only; the date column appears as the pane widens.
function SubmissionTableHeader() {
  return (
    <TableHeader>
      <TableRow className={TABLE_HEADER_ROW_CLASS}>
        <TableHead>
          <span className="sr-only">Image</span>
        </TableHead>
        <TableHead>Funko</TableHead>
        <TableHead>State</TableHead>
        <TableHead className="hidden @3xl:table-cell">Sent</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function SubmissionTable({ submissions }: Props) {
  const resendActions = useResendSubmission();

  return (
    <Table>
      <SubmissionTableHeader />
      <TableBody>
        {submissions.map((submission) => (
          <SubmissionTableRow key={submission.id} submission={submission} resendActions={resendActions} />
        ))}
      </TableBody>
    </Table>
  );
}

export default SubmissionTable;
