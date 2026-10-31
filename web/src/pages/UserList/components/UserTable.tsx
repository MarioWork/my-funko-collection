import { Settings2 } from 'lucide-react';
import type { UserApiModel } from '@app-types/models';
import { USER_ROLE_LABELS } from '@app-types/utility';
import { USER_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { formatDate } from '@utils/dateUtils';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';
import { userTitle } from '../userListUtils';
import UserStateBadge from './UserStateBadge';

type Props = {
  users: UserApiModel[];
};

type RowProps = {
  user: UserApiModel;
};

// Who, what they may do, how they sign in today, since when (the date column appears as the pane widens), and the
// way to manage them: their role, a new temporary password, or deleting them.
function UserTableRow({ user }: RowProps) {
  const title = userTitle(user);

  return (
    <TableRow>
      <TableCell className="max-w-0 min-w-40">
        <p className="truncate font-medium">{title}</p>
      </TableCell>
      <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
      <TableCell>
        <UserStateBadge user={user} />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <LinkButton
          variant="ghost"
          size="sm"
          to={USER_ROUTES_PATHS.manage(String(user.id))}
          aria-label={`Manage ${title}`}
        >
          <Settings2 data-icon="inline-start" aria-hidden="true" />
          <span className="hidden @xl:inline">Manage</span>
        </LinkButton>
      </TableCell>
    </TableRow>
  );
}

// The last column holds each row's "Manage" link: named for screen readers, blank on screen.
function UserTableHeader() {
  return (
    <TableHeader>
      <TableRow className={TABLE_HEADER_ROW_CLASS}>
        <TableHead>Username</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>State</TableHead>
        <TableHead className="hidden @3xl:table-cell">Added</TableHead>
        <TableHead className="sr-only">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function UserTable({ users }: Props) {
  return (
    <Table>
      <UserTableHeader />
      <TableBody>
        {users.map((user) => (
          <UserTableRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}

export default UserTable;
