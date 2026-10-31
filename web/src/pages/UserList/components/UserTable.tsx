import type { UserApiModel } from '@app-types/models';
import { USER_ROLE_LABELS } from '@app-types/utility';
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

// Facts only: who, what they may do, how they sign in today, since when. The date column appears as the pane widens.
function UserTableRow({ user }: RowProps) {
  return (
    <TableRow>
      <TableCell className="max-w-0 min-w-40">
        <p className="truncate font-medium">{userTitle(user)}</p>
      </TableCell>
      <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
      <TableCell>
        <UserStateBadge user={user} />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">
        {formatDate(user.createdAt)}
      </TableCell>
    </TableRow>
  );
}

function UserTable({ users }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className={TABLE_HEADER_ROW_CLASS}>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>State</TableHead>
          <TableHead className="hidden @3xl:table-cell">Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserTableRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}

export default UserTable;
