import { Fingerprint } from 'lucide-react';
import CancelButton from '@components/CancelButton';
import PasskeyButton from '@components/PasskeyButton';
import SubmitButton from '@components/SubmitButton';
import { DialogFooter } from '@components/ui/dialog';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';

type Props = {
  formId: string;
  isSaving: boolean;
  // After a REAUTH_REQUIRED answer the submit confirms with a passkey first.
  needsReauth: boolean;
  onCancel: () => void;
};

function SetPasswordFooter({ formId, isSaving, needsReauth, onCancel }: Props) {
  return (
    <DialogFooter>
      <CancelButton isSubmitting={isSaving} onCancel={onCancel} />
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
        <SubmitButton isSubmitting={isSaving} form={formId}>
          Save password
        </SubmitButton>
      )}
    </DialogFooter>
  );
}

export default SetPasswordFooter;
