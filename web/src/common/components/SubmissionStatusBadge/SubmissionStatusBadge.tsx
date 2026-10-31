import { SUBMISSION_STATUS_LABELS, SubmissionStatusUtil } from '@app-types/utility';
import { Badge } from '@components/ui/badge';

type Props = {
  status: SubmissionStatusUtil;
};

type BadgeVariant = 'secondary' | 'outline' | 'destructive';

// Text first, colour second: the label always says the state.
const STATUS_VARIANT_MAP: Record<SubmissionStatusUtil, BadgeVariant> = {
  [SubmissionStatusUtil.WAITING]: 'outline',
  [SubmissionStatusUtil.APPROVED]: 'secondary',
  [SubmissionStatusUtil.REJECTED]: 'destructive',
  [SubmissionStatusUtil.MERGED]: 'secondary',
};

// Where a submission stands: Waiting, Approved, Rejected or Merged.
function SubmissionStatusBadge({ status }: Props) {
  return <Badge variant={STATUS_VARIANT_MAP[status]}>{SUBMISSION_STATUS_LABELS[status]}</Badge>;
}

export default SubmissionStatusBadge;
