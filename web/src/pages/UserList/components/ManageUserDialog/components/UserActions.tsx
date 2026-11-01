import { Eye, KeyRound, PencilLine, Trash2, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import {
  LAST_ADMIN_REASON,
  READ_ONLY_HINTS,
  ROLE_HINTS,
  UserChange,
  makeRoleLabel,
  otherRoleOf,
  readOnlyLabel,
} from '../manageUserDialogUtils';

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
  // Why the button is disabled (the admin is read-only, or the user is the last admin), or undefined.
  reason: string | undefined;
  onPick: (change: UserChange) => void;
};

// Disabled with a reason on hover, keyboard focus and tap, and read out by screen readers.
function ChangeRoleButton({ user, reason, onPick }: UserButtonProps) {
  return (
    <DisabledReason reason={reason}>
      <Button variant="outline" disabled={reason !== undefined} onClick={() => onPick(UserChange.ROLE)}>
        <UserCog data-icon="inline-start" aria-hidden="true" />
        {makeRoleLabel(otherRoleOf(user.role))}
      </Button>
    </DisabledReason>
  );
}

function ReadOnlyButton({ user, reason, onPick }: UserButtonProps) {
  const Icon = user.isReadOnly ? PencilLine : Eye;

  return (
    <DisabledReason reason={reason}>
      <Button variant="outline" disabled={reason !== undefined} onClick={() => onPick(UserChange.READ_ONLY)}>
        <Icon data-icon="inline-start" aria-hidden="true" />
        {readOnlyLabel(user.isReadOnly)}
      </Button>
    </DisabledReason>
  );
}

function TemporaryPasswordButton({ reason, onPick }: Omit<UserButtonProps, 'user'>) {
  return (
    <DisabledReason reason={reason}>
      <Button variant="outline" disabled={reason !== undefined} onClick={() => onPick(UserChange.TEMPORARY_PASSWORD)}>
        <KeyRound data-icon="inline-start" aria-hidden="true" />
        New temporary password
      </Button>
    </DisabledReason>
  );
}

function DeleteUserButton({ reason, onPick }: Omit<UserButtonProps, 'user'>) {
  return (
    <DisabledReason reason={reason}>
      <Button variant="destructive" disabled={reason !== undefined} onClick={() => onPick(UserChange.DELETE)}>
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

// The four changes an admin can make to a user. The last admin who can make changes can't be made a member, made
// read-only or deleted: those buttons stay, disabled, saying why. A read-only admin sees every button disabled.
function UserActions({ user, onPick }: Props) {
  const readOnlyReason = useReadOnlyReason();
  const lastAdminReason = firstReason(readOnlyReason, reasonWhen(user.isLastAdmin, LAST_ADMIN_REASON));
  // Allowing a read-only user to make changes never leaves the app without an admin.
  const readOnlyChangeReason = user.isReadOnly ? readOnlyReason : lastAdminReason;

  return (
    <div className="flex flex-col gap-3">
      <ActionRow heading="Role" hint={ROLE_HINTS[user.role]}>
        <ChangeRoleButton user={user} reason={lastAdminReason} onPick={onPick} />
      </ActionRow>
      <ActionRow heading="Changes" hint={user.isReadOnly ? READ_ONLY_HINTS.READ_ONLY : READ_ONLY_HINTS.CAN_CHANGE}>
        <ReadOnlyButton user={user} reason={readOnlyChangeReason} onPick={onPick} />
      </ActionRow>
      <ActionRow heading="Password" hint="Forgot it? Give them a new temporary password.">
        <TemporaryPasswordButton reason={readOnlyReason} onPick={onPick} />
      </ActionRow>
      <ActionRow heading="Delete" hint="Removes them with their collections, items and tags.">
        <DeleteUserButton reason={lastAdminReason} onPick={onPick} />
      </ActionRow>
    </div>
  );
}

export default UserActions;
