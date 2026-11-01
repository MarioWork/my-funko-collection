import type { ReauthMethodUtil } from '@app-types/utility';
import CancelButton from '@components/CancelButton';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import SubmitButton from '@components/SubmitButton';
import { DialogFooter } from '@components/ui/dialog';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';

type Props = {
  formId: string;
  // The confirm step's password form, submitted by "Confirm with password".
  passwordFormId: string;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the submit confirms it's the user first.
  step: ConfirmIdentityStep;
  onConfirm: (method: ReauthMethodUtil) => void;
  onCancel: () => void;
};

function SetPasswordFooter({ formId, passwordFormId, isSaving, step, onConfirm, onCancel }: Props) {
  return (
    <DialogFooter>
      <CancelButton isSubmitting={isSaving} onCancel={onCancel} />
      {step.needsReauth ? (
        <ConfirmIdentityButtons step={step} isSaving={isSaving} passwordFormId={passwordFormId} onConfirm={onConfirm} />
      ) : (
        <SubmitButton isSubmitting={isSaving} form={formId}>
          Save password
        </SubmitButton>
      )}
    </DialogFooter>
  );
}

export default SetPasswordFooter;
