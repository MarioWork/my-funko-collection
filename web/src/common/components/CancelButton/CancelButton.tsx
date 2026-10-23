import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  isSubmitting: boolean;
  onCancel: () => void;
};

// A form's Cancel: disabled while saving (leaving mid-save would hide the result), with the reason.
function CancelButton({ isSubmitting, onCancel }: Props) {
  return (
    <DisabledReason reason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
    </DisabledReason>
  );
}

export default CancelButton;
