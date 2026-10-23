import { useFetcher } from 'react-router';
import type { PasskeyApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
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
import { AuthApiErrorCodes } from '@services/authService/authService';
import { authFailureMessage } from '@utils/authMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { useConfirmIdentityStep } from '../../../hooks/useConfirmIdentityStep';
import { CONFIRM_IDENTITY_COPY, PASSKEY_FAILURE_MESSAGES } from '../../../settingsUtils';
import RemovePasskeyFooter from './RemovePasskeyFooter';

type Props = {
  passkey: PasskeyApiModel;
  onClose: () => void;
};

type DialogCopy = {
  title: string;
  description: string;
  confirmLabel: string;
};

function copyOf(passkeyName: string, needsReauth: boolean): DialogCopy {
  if (needsReauth) {
    return {
      title: CONFIRM_IDENTITY_COPY.TITLE,
      description: `${CONFIRM_IDENTITY_COPY.DESCRIPTION} “${passkeyName}” is removed right after.`,
      confirmLabel: CONFIRM_IDENTITY_COPY.BUTTON,
    };
  }

  return {
    title: `Remove “${passkeyName}”?`,
    description: "You won't be able to sign in with it anymore. Your other passkeys keep working.",
    confirmLabel: 'Remove passkey',
  };
}

// Mounted per passkey (keyed by id), so its fetcher starts clean. A first answer of REAUTH_REQUIRED switches it to
// "Confirm it's you" (useConfirmIdentityStep): the next press runs a passkey sign-in, then the removal.
function RemovePasskeyDialog({ passkey, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isRemoving = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false && !isRemoving ? fetcher.data.error : undefined;
  const needsReauth = useConfirmIdentityStep(failure);
  const isReauthAnswer = failure?.code === AuthApiErrorCodes.REAUTH_REQUIRED;
  const copy = copyOf(passkey.name, needsReauth);
  const shownFailure = isReauthAnswer ? undefined : failure;

  useActionToast(fetcher, { successMessage: 'Passkey removed' });
  useCloseOnSuccess(fetcher, onClose);

  const remove = () =>
    void fetcher.submit(createFormData({ isReauth: needsReauth }), {
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
        {shownFailure ? (
          <InlineAlert tone="error">{authFailureMessage(shownFailure, PASSKEY_FAILURE_MESSAGES)}</InlineAlert>
        ) : null}
        <RemovePasskeyFooter
          isRemoving={isRemoving}
          needsReauth={needsReauth}
          confirmLabel={copy.confirmLabel}
          onConfirm={remove}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default RemovePasskeyDialog;
