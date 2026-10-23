import { Plus } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  label: string;
  isSubmitting: boolean;
  onIncrement: () => void;
};

type IncrementIconProps = {
  isSubmitting: boolean;
};

function IncrementIcon({ isSubmitting }: IncrementIconProps) {
  if (isSubmitting) return <Spinner data-icon="inline-start" />;

  return <Plus data-icon="inline-start" aria-hidden="true" />;
}

// The found card's main action: +1 (or add) in the picked collections, a spinner while it saves.
function IncrementButton({ label, isSubmitting, onIncrement }: Props) {
  return (
    <DisabledReason reason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}>
      <Button onClick={onIncrement} disabled={isSubmitting}>
        <IncrementIcon isSubmitting={isSubmitting} />
        {label}
      </Button>
    </DisabledReason>
  );
}

export default IncrementButton;
