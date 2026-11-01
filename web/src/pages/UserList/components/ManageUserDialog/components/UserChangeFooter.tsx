import type { ReactNode } from 'react';
import { ReauthMethodUtil } from '@app-types/utility';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import DisabledReason from '@components/DisabledReason';
import { AlertDialogCancel, AlertDialogFooter } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import type { UserChangeConfirm } from './UserChangeDialog';

type Props = {
  confirmLabel: string;
  confirmIcon: ReactNode;
  isDestructive: boolean;
  isSaving: boolean;
  confirm: UserChangeConfirm;
  // The confirm button submits this form when there is one (the username of a new temporary password).
  formId?: string;
};

type ChangeButtonProps = Omit<Props, 'confirm'> & {
  onConfirm: () => void;
};

function ChangeButton({ confirmLabel, confirmIcon, isDestructive, isSaving, formId, onConfirm }: ChangeButtonProps) {
  return (
    <DisabledReason reason={reasonWhen(isSaving, DISABLED_REASONS.WORKING)}>
      <Button
        type={formId ? 'submit' : 'button'}
        form={formId}
        variant={isDestructive ? 'destructive' : 'default'}
        disabled={isSaving}
        onClick={formId ? undefined : onConfirm}
      >
        {isSaving ? <Spinner data-icon="inline-start" /> : confirmIcon}
        {confirmLabel}
      </Button>
    </DisabledReason>
  );
}

// Cancel and the confirm button, both held while the change runs: red for a delete, the primary colour otherwise;
// the ways to confirm it's the admin once the server asks.
function UserChangeFooter({ confirm, ...changeButton }: Props) {
  const { isSaving } = changeButton;

  return (
    <AlertDialogFooter>
      <DisabledReason reason={reasonWhen(isSaving, DISABLED_REASONS.WORKING)} mode="wrapper">
        <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
      </DisabledReason>
      {confirm.step.needsReauth ? (
        <ConfirmIdentityButtons
          step={confirm.step}
          isSaving={isSaving}
          passwordFormId={confirm.passwordFormId}
          onConfirm={confirm.onConfirm}
        />
      ) : (
        <ChangeButton {...changeButton} onConfirm={() => confirm.onConfirm(ReauthMethodUtil.PASSKEY)} />
      )}
    </AlertDialogFooter>
  );
}

export default UserChangeFooter;
