import type { LucideIcon } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';

type Props = {
  label: string;
  icon: LucideIcon;
  isDisabled: boolean;
  disabledReason: string | undefined;
  // The id of a message about the missing photo, linked to this button.
  errorId?: string;
  className?: string;
  onClick: () => void;
};

// One of the visible buttons that open a hidden file input.
function PickButton({ label, icon: Icon, isDisabled, disabledReason, errorId, className, onClick }: Props) {
  return (
    <DisabledReason reason={disabledReason}>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={isDisabled}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        onClick={onClick}
      >
        <Icon data-icon="inline-start" aria-hidden="true" />
        {label}
      </Button>
    </DisabledReason>
  );
}

export default PickButton;
