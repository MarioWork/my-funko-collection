import { Trash2 } from 'lucide-react';
import type { UserApiModel } from '@app-types/models';
import { HttpVerbsUtil } from '@app-types/utility';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { userTitle } from '../../../userListUtils';
import { useUserChange } from '../hooks/useUserChange';
import { SIGNS_OUT_EVERYWHERE } from '../manageUserDialogUtils';
import UserChangeDialog, { type UserChangeConfirm } from './UserChangeDialog';
import UserChangeFooter from './UserChangeFooter';

type Props = {
  user: UserApiModel;
  onClose: () => void;
  // Once deleted, the manage panel has nobody left to show: back to the list.
  onDeleted: () => void;
};

const DELETE_LABEL = 'Delete user';
const CONFIRM_PASSWORD_FORM_ID = 'delete-user-confirm';

// Not undoable, so it asks first. Their collections, items and tags go with them; the catalogue stays.
function DeleteUserDialog({ user, onClose, onDeleted }: Props) {
  const change = useUserChange(user.id);
  const name = userTitle(user);

  const confirm: UserChangeConfirm = {
    step: change.step,
    passwordFormId: CONFIRM_PASSWORD_FORM_ID,
    onConfirm: (reauthMethod) => change.submit(HttpVerbsUtil.DELETE, undefined, reauthMethod),
  };

  useActionToast(change.fetcher, { successMessage: `${name} deleted` });
  useCloseOnSuccess(change.fetcher, onDeleted);

  return (
    <UserChangeDialog
      title={`Delete ${name}?`}
      description={`Their collections, items and tags are deleted with them, for good. Funkos stay in the catalogue, and photos they added stay too. ${SIGNS_OUT_EVERYWHERE}`}
      nextStep={`Then ${name} is deleted.`}
      confirm={confirm}
      isSaving={change.isSaving}
      failure={change.failure}
      onClose={onClose}
      footer={
        <UserChangeFooter
          confirmLabel={DELETE_LABEL}
          confirmIcon={<Trash2 data-icon="inline-start" aria-hidden="true" />}
          isDestructive
          isSaving={change.isSaving}
          confirm={confirm}
        />
      }
    />
  );
}

export default DeleteUserDialog;
