import { useFetcher } from 'react-router';
import type { PasskeyApiModel } from '@app-types/models';
import { HttpVerbsUtil, ReauthMethodUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmPasswordField from '@components/ConfirmPasswordField';
import InlineAlert from '@components/InlineAlert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { useConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { CONFIRM_IDENTITY_COPY, confirmIdentityDescription } from '@utils/reauthUtils';
import { PASSKEY_FAILURE_MESSAGES } from '../../../settingsUtils';
import RemovePasskeyFooter from './RemovePasskeyFooter';

type Props = {
  passkey: PasskeyApiModel;
  onClose: () => void;
};

type DialogCopy = {
  title: string;
  description: string;
};

const CONFIRM_PASSWORD_FORM_ID = 'remove-passkey-confirm';

function copyOf(passkeyName: string, needsReauth: boolean, canUsePassword: boolean): DialogCopy {
  if (needsReauth) {
    return {
      title: CONFIRM_IDENTITY_COPY.TITLE,
      description: `${confirmIdentityDescription(canUsePassword)} “${passkeyName}” is removed right after.`,
    };
  }

  return {
    title: `Remove “${passkeyName}”?`,
    description: "You won't be able to sign in with it anymore. Your other passkeys keep working.",
  };
}

// Mounted per passkey (keyed by id), so its fetcher starts clean. A first answer of REAUTH_REQUIRED switches it to
// "Confirm it's you" (useConfirmIdentityStep): the next press confirms with a passkey or the password, then removes.
function RemovePasskeyDialog({ passkey, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isRemoving = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isRemoving ? fetcher.data.error : undefined;
  const step = useConfirmIdentityStep(failure);
  const copy = copyOf(passkey.name, step.needsReauth, step.canUsePassword);
  const shownFailure = step.isStepFailure ? undefined : failure;

  useActionToast(fetcher, { successMessage: 'Passkey removed' });
  useCloseOnSuccess(fetcher, onClose);

  const remove = (method: ReauthMethodUtil) =>
    void fetcher.submit(createFormData({ reauth: step.reauthFor(method) }), {
      method: HttpVerbsUtil.DELETE,
      action: AUTH_ROUTES_PATHS.passkey(passkey.id),
    });

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isRemoving) onClose();
  };

  return (
    <AlertDialog open onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ConfirmPasswordField step={step} formId={CONFIRM_PASSWORD_FORM_ID} onConfirm={remove} />
        {shownFailure ? (
          <InlineAlert tone="error">{authFailureMessage(shownFailure, PASSKEY_FAILURE_MESSAGES)}</InlineAlert>
        ) : null}
        <RemovePasskeyFooter
          step={step}
          isRemoving={isRemoving}
          passwordFormId={CONFIRM_PASSWORD_FORM_ID}
          onConfirm={remove}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default RemovePasskeyDialog;
