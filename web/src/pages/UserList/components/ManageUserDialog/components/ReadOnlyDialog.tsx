import { Eye, PencilLine, type LucideIcon } from 'lucide-react';
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

// The words and icon of one direction of the change, for a user named `name`.
type ReadOnlyChangeCopy = {
  title: (name: string) => string;
  hint: string;
  nextStep: (name: string) => string;
  outcome: (name: string) => string;
  icon: LucideIcon;
};

type ReadOnlyChangeDirection = 'makeReadOnly' | 'allowChanges';

const COPY_MAP: Record<ReadOnlyChangeDirection, ReadOnlyChangeCopy> = {
  makeReadOnly: {
    title: (name) => `Make ${name} read-only?`,
    hint: READ_ONLY_HINTS.READ_ONLY,
    nextStep: (name) => `Then ${name} becomes read-only.`,
    outcome: (name) => `${name} is now read-only`,
    icon: Eye,
  },
  allowChanges: {
    title: (name) => `Let ${name} make changes again?`,
    hint: READ_ONLY_HINTS.CAN_CHANGE,
    nextStep: (name) => `Then ${name} can make changes again.`,
    outcome: (name) => `${name} can make changes again`,
    icon: PencilLine,
  },
};

// Makes the user read-only, or lets them make changes again. Their sessions end, so the app shows the change from
// their next sign-in. No Undo in the toast: changing back ends their sessions again and needs its own confirmation.
function ReadOnlyDialog({ user, onClose }: Props) {
  const change = useUserChange(user.id);
  const name = userTitle(user);
  const isMakingReadOnly = !user.isReadOnly;
  const copy = COPY_MAP[isMakingReadOnly ? 'makeReadOnly' : 'allowChanges'];
  const Icon = copy.icon;

  useActionToast(change.fetcher, { successMessage: copy.outcome(name) });
  useCloseOnSuccess(change.fetcher, onClose);

  return (
    <UserChangeDialog
      title={copy.title(name)}
      description={`${copy.hint} ${SIGNS_OUT_EVERYWHERE}`}
      nextStep={copy.nextStep(name)}
      isReauthNeeded={change.isReauthNeeded}
      isSaving={change.isSaving}
      failure={change.failure}
      onClose={onClose}
      footer={
        <UserChangeFooter
          confirmLabel={readOnlyLabel(user.isReadOnly)}
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
