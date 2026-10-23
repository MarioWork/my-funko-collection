import { Pencil, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import ExportSubmenu from './ExportSubmenu';

type Props = {
  collection: CollectionApiModel;
  isBusy: boolean;
  onMakeDefault: () => void;
  onDelete: () => void;
};

type MenuActionItemProps = {
  isDefault: boolean;
  isBusy: boolean;
  // Why the item is disabled, or undefined while it can be used.
  reason: string | undefined;
  onClick: () => void;
};

const IS_DEFAULT_REASON = 'This is already the default collection.';
const DELETE_DEFAULT_REASON = 'The default collection cannot be deleted. Make another one the default first.';

function MakeDefaultItem({ isDefault, isBusy, reason, onClick }: MenuActionItemProps) {
  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem disabled={isDefault || isBusy} onClick={onClick}>
        <Star aria-hidden="true" fill={isDefault ? 'currentColor' : 'none'} />
        {isDefault ? 'Default' : 'Make default'}
      </DropdownMenuItem>
    </DisabledReason>
  );
}

function DeleteItem({ isDefault, isBusy, reason, onClick }: MenuActionItemProps) {
  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem variant="destructive" disabled={isDefault || isBusy} onClick={onClick}>
        <Trash2 aria-hidden="true" />
        Delete
      </DropdownMenuItem>
    </DisabledReason>
  );
}

// The ⋯ menu of one collection: edit, make default, export, delete.
function CollectionMenu({ collection, isBusy, onMakeDefault, onDelete }: Props) {
  const id = String(collection.id);
  const busyReason = reasonWhen(isBusy, DISABLED_REASONS.WORKING);
  const makeDefaultReason = collection.isDefault ? IS_DEFAULT_REASON : busyReason;
  const deleteReason = collection.isDefault ? DELETE_DEFAULT_REASON : busyReason;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link to={COLLECTION_ROUTES_PATHS.editInList(id)} />}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <MakeDefaultItem
          isDefault={collection.isDefault}
          isBusy={isBusy}
          reason={makeDefaultReason}
          onClick={onMakeDefault}
        />
        <ExportSubmenu collection={collection} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DeleteItem isDefault={collection.isDefault} isBusy={isBusy} reason={deleteReason} onClick={onDelete} />
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

export default CollectionMenu;
