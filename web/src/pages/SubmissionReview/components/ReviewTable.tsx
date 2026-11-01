import { ViewTransition } from 'react';
import type { ReviewSubmissionApiModel } from '@app-types/models';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { SubmissionApiReviewStates } from '@services/submissionService/submissionService';
import { LIST_ITEM_TRANSITION_CLASS } from '@utils/motionUtils';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';
import ReviewTableRow from './ReviewTableRow';

type Props = {
  submissions: ReviewSubmissionApiModel[];
  state: SubmissionApiReviewStates;
};

type HeaderProps = {
  state: SubmissionApiReviewStates;
};

// The last column: what the admin can do while it waits, what became of it once done.
const LAST_COLUMN_MAP: Record<SubmissionApiReviewStates, string> = {
  [SubmissionApiReviewStates.WAITING]: 'Review',
  [SubmissionApiReviewStates.DONE]: 'Outcome',
};

function ReviewTableHeader({ state }: HeaderProps) {
  return (
    <TableHeader>
      <TableRow className={TABLE_HEADER_ROW_CLASS}>
        <TableHead>
          <span className="sr-only">Image</span>
        </TableHead>
        <TableHead>Funko</TableHead>
        <TableHead className="text-right">{LAST_COLUMN_MAP[state]}</TableHead>
      </TableRow>
    </TableHeader>
  );
}

// An approved or rejected row leaves the Waiting tab with a glide.
function ReviewTable({ submissions, state }: Props) {
  return (
    <Table>
      <ReviewTableHeader state={state} />
      <TableBody>
        {submissions.map((submission) => (
          <ViewTransition key={submission.id} default={LIST_ITEM_TRANSITION_CLASS}>
            <ReviewTableRow submission={submission} />
          </ViewTransition>
        ))}
      </TableBody>
    </Table>
  );
}

export default ReviewTable;
