import { Link } from 'react-router';
import type { SubmissionApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import SubmissionStatusBadge from '@components/SubmissionStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { formatDate } from '@utils/dateUtils';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';

type Props = {
  submissions: SubmissionApiModel[];
};

type RowProps = {
  submission: SubmissionApiModel;
};

const THUMB_SIZES = '40px';

// The funko's name links to its page (where a waiting one can still be edited); the state is a chip in words.
function SubmissionTableRow({ submission }: RowProps) {
  return (
    <TableRow>
      <TableCell className="w-12">
        <FunkoImage image={submission.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-9 rounded-md" />
      </TableCell>
      <TableCell className="max-w-0 min-w-40">
        <Link
          viewTransition
          to={FUNKO_ROUTES_PATHS.detail(String(submission.id))}
          className="block truncate rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {submission.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          #{submission.number} · {submission.category.name}
        </p>
      </TableCell>
      <TableCell>
        <SubmissionStatusBadge status={submission.status} />
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
  return (
    <Table>
      <SubmissionTableHeader />
      <TableBody>
        {submissions.map((submission) => (
          <SubmissionTableRow key={submission.id} submission={submission} />
        ))}
      </TableBody>
    </Table>
  );
}

export default SubmissionTable;
