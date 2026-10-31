import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import InlineAlert from '@components/InlineAlert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { useFormCompat } from '@hooks/useFormCompat';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { useConfirmIdentityStep } from '../../../hooks/useConfirmIdentityStep';
import { PASSWORD_FAILURE_MESSAGES, setPasswordFormSchema, type SetPasswordFormValues } from '../../../settingsUtils';
import ReauthNotice from './ReauthNotice';
import SetPasswordFooter from './SetPasswordFooter';
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
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
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
        <SetPasswordFooter formId={FORM_ID} isSaving={isSaving} needsReauth={needsReauth} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

export default SetPasswordDialog;
