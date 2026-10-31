import { KeyRound, Trash2, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { reasonWhen } from '@utils/disabledReasonUtils';
import { LAST_ADMIN_REASON, ROLE_HINTS, UserChange, makeRoleLabel, otherRoleOf } from '../manageUserDialogUtils';

type ActionRowProps = {
  heading: string;
  hint: string;
  children: ReactNode;
};

// One change: what it is and does, and its button.
function ActionRow({ heading, hint, children }: ActionRowProps) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">{heading}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </section>
  );
}

type UserButtonProps = {
  user: UserApiModel;
  onPick: (change: UserChange) => void;
};

// Disabled for the last admin, with the reason on hover, keyboard focus and tap, and read out by screen readers.
function ChangeRoleButton({ user, onPick }: UserButtonProps) {
  return (
    <DisabledReason reason={reasonWhen(user.isLastAdmin, LAST_ADMIN_REASON)}>
      <Button variant="outline" disabled={user.isLastAdmin} onClick={() => onPick(UserChange.ROLE)}>
        <UserCog data-icon="inline-start" aria-hidden="true" />
        {makeRoleLabel(otherRoleOf(user.role))}
      </Button>
    </DisabledReason>
  );
}

function DeleteUserButton({ user, onPick }: UserButtonProps) {
  return (
    <DisabledReason reason={reasonWhen(user.isLastAdmin, LAST_ADMIN_REASON)}>
      <Button variant="destructive" disabled={user.isLastAdmin} onClick={() => onPick(UserChange.DELETE)}>
        <Trash2 data-icon="inline-start" aria-hidden="true" />
        Delete user
      </Button>
    </DisabledReason>
  );
}

type Props = {
  user: UserApiModel;
  onPick: (change: UserChange) => void;
};

// The three changes an admin can make to a user. The last admin can't be made a member or deleted: those two
// buttons stay, disabled, saying why.
function UserActions({ user, onPick }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <ActionRow heading="Role" hint={ROLE_HINTS[user.role]}>
        <ChangeRoleButton user={user} onPick={onPick} />
      </ActionRow>
      <ActionRow heading="Password" hint="Forgot it? Give them a new temporary password.">
        <Button variant="outline" onClick={() => onPick(UserChange.TEMPORARY_PASSWORD)}>
          <KeyRound data-icon="inline-start" aria-hidden="true" />
          New temporary password
        </Button>
      </ActionRow>
      <ActionRow heading="Delete" hint="Removes them with their collections, items and tags.">
        <DeleteUserButton user={user} onPick={onPick} />
      </ActionRow>
    </div>
  );
}

export default UserActions;
