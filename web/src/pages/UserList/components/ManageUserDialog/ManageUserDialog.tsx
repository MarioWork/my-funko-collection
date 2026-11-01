import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { UserApiModel } from '@app-types/models';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import FormPanel from '@components/FormPanel';
import { describeUserRole, userTitle } from '../../userListUtils';
import UserStateBadge from '../UserStateBadge';
import ChangeRoleDialog from './components/ChangeRoleDialog';
import DeleteUserDialog from './components/DeleteUserDialog';
import ReadOnlyDialog from './components/ReadOnlyDialog';
import TemporaryPasswordDialog from './components/TemporaryPasswordDialog';
import UserActions from './components/UserActions';
import { useManagedUser } from './hooks/useManagedUser';
import { UserChange } from './manageUserDialogUtils';

type ChangeDialogProps = {
  user: UserApiModel;
  change: UserChange;
  onClose: () => void;
  onDeleted: () => void;
};

// The confirm dialog of the change the admin picked, mounted fresh each time so it starts clean.
function ChangeDialog({ user, change, onClose, onDeleted }: ChangeDialogProps) {
  const dialogs: Record<UserChange, React.ReactNode> = {
    [UserChange.ROLE]: <ChangeRoleDialog user={user} onClose={onClose} />,
    [UserChange.READ_ONLY]: <ReadOnlyDialog user={user} onClose={onClose} />,
    [UserChange.TEMPORARY_PASSWORD]: <TemporaryPasswordDialog user={user} onClose={onClose} />,
    [UserChange.DELETE]: <DeleteUserDialog user={user} onClose={onClose} onDeleted={onDeleted} />,
  };

  return dialogs[change];
}

type UserFactsProps = {
  user: UserApiModel;
};

function UserFacts({ user }: UserFactsProps) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Role</dt>
      <dd>{describeUserRole(user)}</dd>
      <dt className="text-muted-foreground">Sign-in</dt>
      <dd>
        <UserStateBadge user={user} />
      </dd>
    </dl>
  );
}

// Routed under /users/:userId: change one user's role, make them read-only or undo it, give them a new temporary
// password, or delete them. Each asks first in its own dialog and needs a recent sign-in. The user comes from the list behind it, which every change
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
