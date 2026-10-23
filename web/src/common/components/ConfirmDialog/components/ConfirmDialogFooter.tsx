import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@components/ui/alert-dialog';
import { Spinner } from '@components/ui/spinner';
import DisabledReason from '@components/DisabledReason';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  confirmLabel: string;
  isDestructive: boolean;
  isPending: boolean;
  onConfirm: () => void;
};

// Cancel and confirm, both held while the confirm is running.
function ConfirmDialogFooter({ confirmLabel, isDestructive, isPending, onConfirm }: Props) {
  const pendingReason = reasonWhen(isPending, DISABLED_REASONS.WORKING);

  return (
    <AlertDialogFooter>
      <DisabledReason reason={pendingReason} mode="wrapper">
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
      </DisabledReason>
      <DisabledReason reason={pendingReason} mode="wrapper">
        <AlertDialogAction variant={isDestructive ? 'destructive' : 'default'} disabled={isPending} onClick={onConfirm}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {confirmLabel}
        </AlertDialogAction>
      </DisabledReason>
    </AlertDialogFooter>
  );
}

export default ConfirmDialogFooter;
