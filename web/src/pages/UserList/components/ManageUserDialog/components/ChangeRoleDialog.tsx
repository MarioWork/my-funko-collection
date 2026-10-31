import { UserCog } from 'lucide-react';
import type { UserApiModel } from '@app-types/models';
import { HttpVerbsUtil } from '@app-types/utility';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { userTitle } from '../../../userListUtils';
import { useUserChange } from '../hooks/useUserChange';
import {
  ROLE_HINTS,
  SIGNS_OUT_EVERYWHERE,
  makeRoleLabel,
  otherRoleOf,
  roleWithArticle,
} from '../manageUserDialogUtils';
import UserChangeDialog from './UserChangeDialog';
import UserChangeFooter from './UserChangeFooter';

type Props = {
  user: UserApiModel;
  onClose: () => void;
};

// Gives the user the other role. Their sessions end, so the new role applies from their next sign-in. The toast has
// no Undo on purpose: changing back ends their sessions again and needs its own confirmation and recent sign-in.
function ChangeRoleDialog({ user, onClose }: Props) {
  const change = useUserChange(user.id);
  const newRole = otherRoleOf(user.role);
  const name = userTitle(user);
  const label = makeRoleLabel(newRole);

  useActionToast(change.fetcher, { successMessage: `${name} is now ${roleWithArticle(newRole)}` });
  useCloseOnSuccess(change.fetcher, onClose);

  return (
    <UserChangeDialog
      title={`Make ${name} ${roleWithArticle(newRole)}?`}
      description={`${ROLE_HINTS[newRole]} ${SIGNS_OUT_EVERYWHERE}`}
      nextStep={`Then ${name} becomes ${roleWithArticle(newRole)}.`}
      needsReauth={change.needsReauth}
      isSaving={change.isSaving}
      failure={change.failure}
      onClose={onClose}
      footer={
        <UserChangeFooter
          confirmLabel={label}
          confirmIcon={<UserCog data-icon="inline-start" aria-hidden="true" />}
          isDestructive={false}
          isSaving={change.isSaving}
          needsReauth={change.needsReauth}
          onConfirm={() => change.submit(HttpVerbsUtil.PATCH, { role: newRole })}
        />
      }
    />
  );
}

export default ChangeRoleDialog;
