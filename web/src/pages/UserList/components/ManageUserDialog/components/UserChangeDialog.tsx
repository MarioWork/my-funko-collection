import type { ReactNode } from 'react';
import type { ApiError } from '@app-types/models';
import InlineAlert from '@components/InlineAlert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { authFailureMessage } from '@utils/authMessageUtils';
import { CONFIRM_IDENTITY_COPY } from '@utils/reauthUtils';
import { MANAGE_USER_FAILURE_MESSAGES } from '../manageUserDialogUtils';

type Props = {
  title: string;
  description: string;
  // What happens once the admin has confirmed with a passkey: "Then luke is deleted."
  nextStep?: string;
  needsReauth: boolean;
  isSaving: boolean;
  failure: ApiError | undefined;
  footer: ReactNode;
  onClose: () => void;
  children?: ReactNode;
};

// The confirm step of one change to a user. A first answer of REAUTH_REQUIRED turns it into "Confirm it's you"; the
// next press signs in with a passkey, then makes the change.
function UserChangeDialog({
  title,
  description,
  nextStep = '',
  needsReauth,
  isSaving,
  failure,
  footer,
  onClose,
  children,
}: Props) {
  const shownTitle = needsReauth ? CONFIRM_IDENTITY_COPY.TITLE : title;
  const shownDescription = needsReauth ? `${CONFIRM_IDENTITY_COPY.DESCRIPTION} ${nextStep}` : description;

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
        {failure ? (
          <InlineAlert tone="error">{authFailureMessage(failure, MANAGE_USER_FAILURE_MESSAGES)}</InlineAlert>
        ) : null}
        {footer}
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default UserChangeDialog;
