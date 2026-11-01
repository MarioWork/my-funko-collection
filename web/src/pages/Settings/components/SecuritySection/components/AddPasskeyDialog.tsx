import { yupResolver } from '@hookform/resolvers/yup';
import { KeyRound } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { PasskeyApiModel } from '@app-types/models';
import { HttpVerbsUtil, ReauthMethodUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
import ConfirmIdentityButtons from '@components/ConfirmIdentityButtons';
import ConfirmPasswordField from '@components/ConfirmPasswordField';
import InlineAlert from '@components/InlineAlert';
import PasskeyButton from '@components/PasskeyButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { useFormCompat } from '@hooks/useFormCompat';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import ReauthNotice from '@components/ReauthNotice';
import { addPasskeyFormSchema, PASSKEY_FAILURE_MESSAGES, type AddPasskeyFormValues } from '../../../settingsUtils';
import PasskeyNameField from './PasskeyNameField';

type Props = {
  onClose: () => void;
};

const FORM_ID = 'add-passkey';
const CONFIRM_PASSWORD_FORM_ID = `${FORM_ID}-confirm`;

// Mounted while open, so every opening starts with an empty form and a fresh fetcher. The submit goes to the
// passkeys action, which runs the browser's "save a passkey" prompt.
function AddPasskeyDialog({ onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<PasskeyApiModel>>();
  const { control, handleSubmit } = useFormCompat<AddPasskeyFormValues>({
    defaultValues: { name: '' },
    resolver: yupResolver(addPasskeyFormSchema),
  });
  const isAdding = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isAdding ? fetcher.data.error : undefined;
  const step = useConfirmIdentityStep(failure);
  // The confirm step shows its own answers (the notice, a wrong password on its field), not as an error here.
  const shownFailure = step.isStepFailure ? undefined : failure;

  useActionToast(fetcher, { successMessage: 'Passkey added' });
  useCloseOnSuccess(fetcher, onClose);

  function submitWith(method: ReauthMethodUtil) {
    return handleSubmit((values) => {
      void fetcher.submit(createFormData({ passkey: values, reauth: step.chooseReauth(method) }), {
        method: HttpVerbsUtil.POST,
        action: AUTH_ROUTES_PATHS.PASSKEYS,
      });
    });
  }

  const confirm = (method: ReauthMethodUtil) => void submitWith(method)();

  // Closing mid-ceremony would hide its result; the Cancel button says why it is off.
  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isAdding) onClose();
  };

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a passkey</DialogTitle>
          <DialogDescription>Give it a name, then your browser asks where to save it.</DialogDescription>
        </DialogHeader>
        <form
          id={FORM_ID}
          onSubmit={(event) => void submitWith(ReauthMethodUtil.PASSKEY)(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          <PasskeyNameField control={control} idPrefix={FORM_ID} />
          {step.needsReauth ? (
            <ReauthNotice
              nextStep="Then your browser asks where to save the new one."
              canUsePassword={step.canUsePassword}
            />
          ) : null}
        </form>
        <ConfirmPasswordField step={step} formId={CONFIRM_PASSWORD_FORM_ID} onConfirm={confirm} />
        {shownFailure ? (
          <InlineAlert tone="error">{authFailureMessage(shownFailure, PASSKEY_FAILURE_MESSAGES)}</InlineAlert>
        ) : null}
        <DialogFooter>
          <CancelButton isSubmitting={isAdding} onCancel={onClose} />
          {step.needsReauth ? (
            <ConfirmIdentityButtons
              step={step}
              isSaving={isAdding}
              passwordFormId={CONFIRM_PASSWORD_FORM_ID}
              onConfirm={confirm}
            />
          ) : (
            <PasskeyButton
              type="submit"
              form={FORM_ID}
              isWaiting={isAdding}
              isSupported
              icon={<KeyRound data-icon="inline-start" aria-hidden="true" />}
            >
              Create passkey
            </PasskeyButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddPasskeyDialog;
