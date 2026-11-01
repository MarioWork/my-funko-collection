import type { ReactNode } from 'react';
import type { ApiError } from '@app-types/models';
import type { ReauthMethodUtil } from '@app-types/utility';
import ConfirmPasswordField from '@components/ConfirmPasswordField';
import InlineAlert from '@components/InlineAlert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import type { ConfirmIdentityStep } from '@hooks/useConfirmIdentityStep';
import { authFailureMessage } from '@utils/authMessageUtils';
import { CONFIRM_IDENTITY_COPY, confirmIdentityDescription } from '@utils/reauthUtils';
import { MANAGE_USER_FAILURE_MESSAGES } from '../manageUserDialogUtils';

// The change's "confirm it's you" step, and what runs the change once the admin picked how to confirm.
export type UserChangeConfirm = {
  step: ConfirmIdentityStep;
  passwordFormId: string;
  onConfirm: (method: ReauthMethodUtil) => void;
};

type Props = {
  title: string;
  description: string;
  // What happens once the admin has confirmed it's them: "Then luke is deleted."
  nextStep?: string;
  // None once the change is done (the new temporary password on show).
  confirm?: UserChangeConfirm;
  isSaving: boolean;
  failure: ApiError | undefined;
  footer: ReactNode;
  onClose: () => void;
  children?: ReactNode;
};

// The confirm step of one change to a user. A first answer of REAUTH_REQUIRED turns it into "Confirm it's you"; the
// next press confirms with a passkey or the admin's password, then makes the change.
function UserChangeDialog({
  title,
  description,
  nextStep = '',
  confirm,
  isSaving,
  failure,
  footer,
  onClose,
  children,
}: Props) {
  const isReauthNeeded = confirm?.step.needsReauth === true;
  const canUsePassword = confirm?.step.canUsePassword === true;
  const shownTitle = isReauthNeeded ? CONFIRM_IDENTITY_COPY.TITLE : title;
  const shownDescription = isReauthNeeded ? `${confirmIdentityDescription(canUsePassword)} ${nextStep}` : description;

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isSaving) onClose();
  };

  return (
    <AlertDialog open onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{shownTitle}</AlertDialogTitle>
          <AlertDialogDescription>{shownDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {confirm ? (
          <ConfirmPasswordField step={confirm.step} formId={confirm.passwordFormId} onConfirm={confirm.onConfirm} />
        ) : null}
        {failure ? (
          <InlineAlert tone="error">{authFailureMessage(failure, MANAGE_USER_FAILURE_MESSAGES)}</InlineAlert>
        ) : null}
        {footer}
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default UserChangeDialog;
