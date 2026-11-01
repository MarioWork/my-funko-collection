import { Eye, PencilLine } from 'lucide-react';
import type { UserApiModel } from '@app-types/models';
import { HttpVerbsUtil } from '@app-types/utility';
import { useActionToast } from '@hooks/useActionToast';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { userTitle } from '../../../userListUtils';
import { useUserChange } from '../hooks/useUserChange';
import { READ_ONLY_HINTS, SIGNS_OUT_EVERYWHERE, readOnlyLabel } from '../manageUserDialogUtils';
import UserChangeDialog from './UserChangeDialog';
import UserChangeFooter from './UserChangeFooter';

type Props = {
  user: UserApiModel;
  onClose: () => void;
};

// Makes the user read-only, or lets them make changes again. Their sessions end, so the app shows the change from
// their next sign-in. No Undo in the toast: changing back ends their sessions again and needs its own confirmation.
function ReadOnlyDialog({ user, onClose }: Props) {
  const change = useUserChange(user.id);
  const name = userTitle(user);
  const isMakingReadOnly = !user.isReadOnly;
  const label = readOnlyLabel(user.isReadOnly);
  const hint = isMakingReadOnly ? READ_ONLY_HINTS.READ_ONLY : READ_ONLY_HINTS.CAN_CHANGE;
  const Icon = isMakingReadOnly ? Eye : PencilLine;
  const outcome = isMakingReadOnly ? `${name} is now read-only` : `${name} can make changes again`;

  useActionToast(change.fetcher, { successMessage: outcome });
  useCloseOnSuccess(change.fetcher, onClose);

  return (
    <UserChangeDialog
      title={isMakingReadOnly ? `Make ${name} read-only?` : `Let ${name} make changes again?`}
      description={`${hint} ${SIGNS_OUT_EVERYWHERE}`}
      nextStep={isMakingReadOnly ? `Then ${name} becomes read-only.` : `Then ${name} can make changes again.`}
      isReauthNeeded={change.isReauthNeeded}
      isSaving={change.isSaving}
      failure={change.failure}
      onClose={onClose}
      footer={
        <UserChangeFooter
          confirmLabel={label}
          confirmIcon={<Icon data-icon="inline-start" aria-hidden="true" />}
          isDestructive={false}
          isSaving={change.isSaving}
          isReauthNeeded={change.isReauthNeeded}
          onConfirm={() => change.submit(HttpVerbsUtil.PATCH, { isReadOnly: isMakingReadOnly })}
        />
      }
    />
  );
}

export default ReadOnlyDialog;
