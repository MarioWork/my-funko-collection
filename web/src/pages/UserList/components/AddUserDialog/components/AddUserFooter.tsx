import { UserPlus } from 'lucide-react';
import type { ReauthMethodUtil } from '@app-types/utility';
import CancelButton from '@components/CancelButton';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import SubmitButton from '@components/SubmitButton';
import { Button } from '@components/ui/button';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';

type Props = {
  formId: string;
  // The confirm step's password form, submitted by "Confirm with password".
  passwordFormId: string;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the submit confirms it's the admin first.
  step: ConfirmIdentityStep;
  // The user exists: only "Done" is left.
  isCreated: boolean;
  onConfirm: (method: ReauthMethodUtil) => void;
  onClose: () => void;
};

type FormButtonsProps = Omit<Props, 'isCreated'>;

function FormButtons({ formId, passwordFormId, isSaving, step, onConfirm, onClose }: FormButtonsProps) {
  return (
    <>
      <CancelButton isSubmitting={isSaving} onCancel={onClose} />
      {step.needsReauth ? (
        <ConfirmIdentityButtons step={step} isSaving={isSaving} passwordFormId={passwordFormId} onConfirm={onConfirm} />
      ) : (
        <SubmitButton
          isSubmitting={isSaving}
          form={formId}
          icon={<UserPlus data-icon="inline-start" aria-hidden="true" />}
        >
          Create user
        </SubmitButton>
      )}
    </>
  );
}

function AddUserFooter({ isCreated, onClose, ...formButtons }: Props) {
  if (isCreated) return <Button onClick={onClose}>Done</Button>;

  return <FormButtons {...formButtons} onClose={onClose} />;
}

export default AddUserFooter;
