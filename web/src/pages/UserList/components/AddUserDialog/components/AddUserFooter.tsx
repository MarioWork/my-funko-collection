import { Fingerprint, UserPlus } from 'lucide-react';
import CancelButton from '@components/CancelButton';
import PasskeyButton from '@components/PasskeyButton';
import SubmitButton from '@components/SubmitButton';
import { Button } from '@components/ui/button';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';

type Props = {
  formId: string;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the submit confirms with a passkey first.
  needsReauth: boolean;
  // The user exists: only "Done" is left.
  isCreated: boolean;
  onClose: () => void;
};

type FormButtonsProps = Omit<Props, 'isCreated'>;

function FormButtons({ formId, isSaving, needsReauth, onClose }: FormButtonsProps) {
  return (
    <>
      <CancelButton isSubmitting={isSaving} onCancel={onClose} />
      {needsReauth ? (
        <PasskeyButton
          type="submit"
          form={formId}
          isWaiting={isSaving}
          isSupported
          icon={<Fingerprint data-icon="inline-start" aria-hidden="true" />}
        >
          {CONFIRM_IDENTITY_COPY.BUTTON}
        </PasskeyButton>
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
