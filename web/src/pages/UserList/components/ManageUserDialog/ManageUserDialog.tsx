import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { UserApiModel } from '@app-types/models';
import { USER_ROLE_LABELS } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import FormPanel from '@components/FormPanel';
import { userTitle } from '../../userListUtils';
import UserStateBadge from '../UserStateBadge';
import ChangeRoleDialog from './components/ChangeRoleDialog';
import DeleteUserDialog from './components/DeleteUserDialog';
import TemporaryPasswordDialog from './components/TemporaryPasswordDialog';
import UserActions from './components/UserActions';
import { useManagedUser } from './hooks/useManagedUser';
import { USER_CHANGE, type UserChange } from './manageUserDialogUtils';

type ChangeDialogProps = {
  user: UserApiModel;
  change: UserChange;
  onClose: () => void;
  onDeleted: () => void;
};

type UserFactsProps = {
  user: UserApiModel;
};

// The confirm dialog of the change the admin picked, mounted fresh each time so it starts clean.
function ChangeDialog({ user, change, onClose, onDeleted }: ChangeDialogProps) {
  const dialogs: Record<UserChange, React.ReactNode> = {
    [USER_CHANGE.ROLE]: <ChangeRoleDialog user={user} onClose={onClose} />,
    [USER_CHANGE.TEMPORARY_PASSWORD]: <TemporaryPasswordDialog user={user} onClose={onClose} />,
    [USER_CHANGE.DELETE]: <DeleteUserDialog user={user} onClose={onClose} onDeleted={onDeleted} />,
  };

  return dialogs[change];
}

function UserFacts({ user }: UserFactsProps) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Role</dt>
      <dd>{USER_ROLE_LABELS[user.role]}</dd>
      <dt className="text-muted-foreground">Sign-in</dt>
      <dd>
        <UserStateBadge user={user} />
      </dd>
    </dl>
  );
}

// Routed under /users/:userId: change one user's role, give them a new temporary password, or delete them. Each asks
// first in its own dialog and needs a recent sign-in. The user comes from the list behind it, which every change
// reloads; a link to a user the list does not hold sends the admin back to the list.
function ManageUserDialog() {
  const user = useManagedUser();
  const navigate = useNavigate();
  const [change, setChange] = useState<UserChange>();

  const close = () => void navigate(USER_ROUTES_PATHS.BASE);

  if (!user) return <Navigate to={USER_ROUTES_PATHS.BASE} replace />;

  return (
    <FormPanel title={`Manage ${userTitle(user)}`} onClose={close}>
      <UserFacts user={user} />
      <UserActions user={user} onPick={setChange} />
      {change ? (
        <ChangeDialog user={user} change={change} onClose={() => setChange(undefined)} onDeleted={close} />
      ) : null}
    </FormPanel>
  );
}

export default ManageUserDialog;
