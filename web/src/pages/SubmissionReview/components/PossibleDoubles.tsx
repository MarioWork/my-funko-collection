import { CopyCheck } from 'lucide-react';
import type { PossibleDoubleApiModel } from '@app-types/models';
import { DOUBLE_MATCH_FIELD_LABELS, SUBMISSION_STATUS_LABELS, SubmissionStatusUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import TextLink from '@components/TextLink';
import { Badge } from '@components/ui/badge';

type Props = {
  doubles: PossibleDoubleApiModel[];
};

type DoubleProps = {
  double: PossibleDoubleApiModel;
};

// "same barcode" / "same barcode, same number and category"; and "waiting" when the other is a submission too.
function describeMatch(double: PossibleDoubleApiModel): string {
  const reasons = double.matchedOn.map((field) => DOUBLE_MATCH_FIELD_LABELS[field]).join(', ');
  const isSubmissionToo = double.status !== SubmissionStatusUtil.APPROVED;

  return isSubmissionToo ? `${reasons}; ${SUBMISSION_STATUS_LABELS[double.status].toLowerCase()} too` : reasons;
}

function PossibleDouble({ double }: DoubleProps) {
  return (
    <li className="text-xs text-muted-foreground">
      <TextLink to={FUNKO_ROUTES_PATHS.detail(String(double.id))}>
        #{double.number} {double.name}
      </TextLink>{' '}
      ({describeMatch(double)})
    </li>
  );
}

// "Maybe a double": another funko with the same barcode, or the same number in the same category. A hint for the
// admin, never a block: approving still works unless the catalogue holds the very same funko or barcode.
function PossibleDoubles({ doubles }: Props) {
  if (doubles.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col items-start gap-1">
      <Badge variant="outline">
        <CopyCheck data-icon="inline-start" aria-hidden="true" />
        Maybe a double
      </Badge>
      <ul className="flex flex-col gap-0.5">
        {doubles.map((double) => (
          <PossibleDouble key={double.id} double={double} />
        ))}
      </ul>
    </div>
  );
}

export default PossibleDoubles;
