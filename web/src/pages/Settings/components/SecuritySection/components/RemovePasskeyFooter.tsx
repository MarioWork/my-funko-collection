import { Trash2 } from 'lucide-react';
import { ReauthMethodUtil } from '@app-types/utility';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import DisabledReason from '@components/DisabledReason';
import { AlertDialogCancel, AlertDialogFooter } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  step: ConfirmIdentityStep;
  isRemoving: boolean;
  passwordFormId: string;
  onConfirm: (method: ReauthMethodUtil) => void;
};

type RemoveButtonProps = Pick<Props, 'isRemoving' | 'onConfirm'>;

const REMOVE_LABEL = 'Remove passkey';

function RemoveButton({ isRemoving, onConfirm }: RemoveButtonProps) {
  return (
    <DisabledReason reason={reasonWhen(isRemoving, DISABLED_REASONS.WORKING)}>
      <Button variant="destructive" disabled={isRemoving} onClick={() => onConfirm(ReauthMethodUtil.PASSKEY)}>
        {isRemoving ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" aria-hidden="true" />}
        {REMOVE_LABEL}
      </Button>
    </DisabledReason>
  );
}

// Cancel and the confirm button: red for the removal itself, the ways to confirm it's you once the server asks.
function RemovePasskeyFooter({ step, isRemoving, passwordFormId, onConfirm }: Props) {
  return (
    <AlertDialogFooter>
      <DisabledReason reason={reasonWhen(isRemoving, DISABLED_REASONS.WORKING)} mode="wrapper">
        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
      </DisabledReason>
      {step.needsReauth ? (
        <ConfirmIdentityButtons
          step={step}
          isSaving={isRemoving}
          passwordFormId={passwordFormId}
          onConfirm={onConfirm}
        />
      ) : (
        <RemoveButton isRemoving={isRemoving} onConfirm={onConfirm} />
      )}
    </AlertDialogFooter>
  );
}

export default RemovePasskeyFooter;
