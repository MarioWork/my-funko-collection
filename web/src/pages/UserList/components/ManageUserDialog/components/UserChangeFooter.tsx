import { Fingerprint } from 'lucide-react';
import type { ReactNode } from 'react';
import DisabledReason from '@components/DisabledReason';
import { AlertDialogCancel, AlertDialogFooter } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';

type Props = {
  confirmLabel: string;
  confirmIcon: ReactNode;
  isDestructive: boolean;
  isSaving: boolean;
  isReauthNeeded: boolean;
  // The confirm button submits this form when there is one (the username of a new temporary password).
  formId?: string;
  onConfirm: () => void;
};

type ConfirmIconProps = Pick<Props, 'confirmIcon' | 'isSaving' | 'isReauthNeeded'>;

function ConfirmIcon({ confirmIcon, isSaving, isReauthNeeded }: ConfirmIconProps) {
  if (isSaving) return <Spinner data-icon="inline-start" />;

  if (isReauthNeeded) return <Fingerprint data-icon="inline-start" aria-hidden="true" />;

  return confirmIcon;
}

// Cancel and the confirm button, both held while the change runs: red for a delete, the primary colour otherwise
// and for "Confirm with passkey".
function UserChangeFooter({
  confirmLabel,
  confirmIcon,
  isDestructive,
  isSaving,
  isReauthNeeded,
  formId,
  onConfirm,
}: Props) {
  const busyReason = reasonWhen(isSaving, DISABLED_REASONS.WORKING);
  const isRed = isDestructive && !isReauthNeeded;

  return (
    <AlertDialogFooter>
      <DisabledReason reason={busyReason} mode="wrapper">
        <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
      </DisabledReason>
      <DisabledReason reason={busyReason}>
        <Button
          type={formId ? 'submit' : 'button'}
          form={formId}
          variant={isRed ? 'destructive' : 'default'}
          disabled={isSaving}
          onClick={formId ? undefined : onConfirm}
        >
          <ConfirmIcon confirmIcon={confirmIcon} isSaving={isSaving} isReauthNeeded={isReauthNeeded} />
          {isReauthNeeded ? CONFIRM_IDENTITY_COPY.BUTTON : confirmLabel}
        </Button>
      </DisabledReason>
    </AlertDialogFooter>
  );
}

export default UserChangeFooter;
