import { Fingerprint, Trash2 } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import { AlertDialogCancel, AlertDialogFooter } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  isRemoving: boolean;
  needsReauth: boolean;
  confirmLabel: string;
  onConfirm: () => void;
};

type RemoveIconProps = {
  isRemoving: boolean;
  needsReauth: boolean;
};

function RemoveIcon({ isRemoving, needsReauth }: RemoveIconProps) {
  if (isRemoving) return <Spinner data-icon="inline-start" />;

  if (needsReauth) return <Fingerprint data-icon="inline-start" aria-hidden="true" />;

  return <Trash2 data-icon="inline-start" aria-hidden="true" />;
}

// Cancel and the confirm button: red for the removal itself, the primary colour for "Confirm with passkey".
function RemovePasskeyFooter({ isRemoving, needsReauth, confirmLabel, onConfirm }: Props) {
  const busyReason = isRemoving ? DISABLED_REASONS.PASSKEY_WAITING : undefined;

  return (
    <AlertDialogFooter>
      <DisabledReason reason={busyReason} mode="wrapper">
        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
      </DisabledReason>
      <DisabledReason reason={busyReason}>
        <Button variant={needsReauth ? 'default' : 'destructive'} disabled={isRemoving} onClick={onConfirm}>
          <RemoveIcon isRemoving={isRemoving} needsReauth={needsReauth} />
          {confirmLabel}
        </Button>
      </DisabledReason>
    </AlertDialogFooter>
  );
}

export default RemovePasskeyFooter;
