import { yupResolver } from '@hookform/resolvers/yup';
import { Fingerprint, KeyRound } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { PasskeyApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
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
import { AuthApiErrorCodes } from '@services/authService/authService';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { useConfirmIdentityStep } from '../../../hooks/useConfirmIdentityStep';
import {
  addPasskeyFormSchema,
  CONFIRM_IDENTITY_COPY,
  PASSKEY_FAILURE_MESSAGES,
  type AddPasskeyFormValues,
} from '../../../settingsUtils';
import PasskeyNameField from './PasskeyNameField';

type Props = {
  onClose: () => void;
};

const FORM_ID = 'add-passkey';

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
  const needsReauth = useConfirmIdentityStep(failure);
  // The REAUTH_REQUIRED answer itself is shown as the "confirm it's you" notice, not as an error.
  const shownFailure = failure?.code === AuthApiErrorCodes.REAUTH_REQUIRED ? undefined : failure;

  useActionToast(fetcher, { successMessage: 'Passkey added' });
  useCloseOnSuccess(fetcher, onClose);

  const onSubmit = handleSubmit((values) => {
    void fetcher.submit(createFormData({ passkey: values, isReauth: needsReauth }), {
      method: HttpVerbsUtil.POST,
      action: AUTH_ROUTES_PATHS.PASSKEYS,
    });
  });

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
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <PasskeyNameField control={control} idPrefix={FORM_ID} />
          {needsReauth ? (
            <InlineAlert tone="info">
              <strong className="font-semibold">{CONFIRM_IDENTITY_COPY.TITLE}.</strong>{' '}
              {CONFIRM_IDENTITY_COPY.DESCRIPTION} Then your browser asks where to save the new one.
            </InlineAlert>
          ) : null}
          {shownFailure ? (
            <InlineAlert tone="error">{authFailureMessage(shownFailure, PASSKEY_FAILURE_MESSAGES)}</InlineAlert>
          ) : null}
        </form>
        <DialogFooter>
          <CancelButton isSubmitting={isAdding} onCancel={onClose} />
          <PasskeyButton
            type="submit"
            form={FORM_ID}
            isWaiting={isAdding}
            isSupported
            icon={
              needsReauth ? (
                <Fingerprint data-icon="inline-start" aria-hidden="true" />
              ) : (
                <KeyRound data-icon="inline-start" aria-hidden="true" />
              )
            }
          >
            {needsReauth ? CONFIRM_IDENTITY_COPY.BUTTON : 'Create passkey'}
          </PasskeyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddPasskeyDialog;
