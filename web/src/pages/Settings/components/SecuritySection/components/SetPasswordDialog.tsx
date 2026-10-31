import { yupResolver } from '@hookform/resolvers/yup';
import { Fingerprint } from 'lucide-react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
import InlineAlert from '@components/InlineAlert';
import PasskeyButton from '@components/PasskeyButton';
import SubmitButton from '@components/SubmitButton';
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
  CONFIRM_IDENTITY_COPY,
  PASSWORD_FAILURE_MESSAGES,
  setPasswordFormSchema,
  type SetPasswordFormValues,
} from '../../../settingsUtils';
import ReauthNotice from './ReauthNotice';
import SetPasswordFields from './SetPasswordFields';

type Props = {
  // Null before the first password: the dialog then says "Set" instead of "Change".
  username: string | null;
  onClose: () => void;
};

const FORM_ID = 'set-password';
// Answers the dialog shows elsewhere than in its alert: the reauth one as the notice, the common one on its field.
const NOT_ALERTED_CODES = new Set<string>([AuthApiErrorCodes.REAUTH_REQUIRED, AuthApiErrorCodes.COMMON_PASSWORD]);

// Mounted while open, so every opening starts fresh. The username is filled in from the last one; the password
// field is "new-password", so a password manager offers to make one and saves it after.
function SetPasswordDialog({ username, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const { control, handleSubmit } = useFormCompat<SetPasswordFormValues>({
    defaultValues: { username: username ?? '', password: '' },
    resolver: yupResolver(setPasswordFormSchema),
  });
  const isSaving = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isSaving ? fetcher.data.error : undefined;
  const needsReauth = useConfirmIdentityStep(failure);
  const passwordError = failure?.code === AuthApiErrorCodes.COMMON_PASSWORD ? failure.message : undefined;
  const alertedFailure = failure?.code && NOT_ALERTED_CODES.has(failure.code) ? undefined : failure;
  const title = username ? 'Change your password' : 'Set a password';

  useActionToast(fetcher, { successMessage: 'Password saved' });
  useCloseOnSuccess(fetcher, onClose);

  const onSubmit = handleSubmit((credentials) => {
    void fetcher.submit(createFormData({ credentials, isReauth: needsReauth }), {
      method: HttpVerbsUtil.PUT,
      action: AUTH_ROUTES_PATHS.PASSWORD,
    });
  });

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isSaving) onClose();
  };

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Sign in with it on any device, next to your passkeys.</DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <SetPasswordFields control={control} idPrefix={FORM_ID} passwordError={passwordError} />
          {needsReauth ? <ReauthNotice nextStep="Then the password is saved." /> : null}
          {alertedFailure ? (
            <InlineAlert tone="error">{authFailureMessage(alertedFailure, PASSWORD_FAILURE_MESSAGES)}</InlineAlert>
          ) : null}
        </form>
        <DialogFooter>
          <CancelButton isSubmitting={isSaving} onCancel={onClose} />
          {needsReauth ? (
            <PasskeyButton
              type="submit"
              form={FORM_ID}
              isWaiting={isSaving}
              isSupported
              icon={<Fingerprint data-icon="inline-start" aria-hidden="true" />}
            >
              {CONFIRM_IDENTITY_COPY.BUTTON}
            </PasskeyButton>
          ) : (
            <SubmitButton isSubmitting={isSaving} form={FORM_ID}>
              Save password
            </SubmitButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SetPasswordDialog;
