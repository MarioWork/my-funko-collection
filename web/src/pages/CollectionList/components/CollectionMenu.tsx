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
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import ExportSubmenu from './ExportSubmenu';

type Props = {
  collection: CollectionApiModel;
  isBusy: boolean;
  onMakeDefault: () => void;
  onDelete: () => void;
};

type MenuActionItemProps = {
  isDefault: boolean;
  // Why the item is disabled, or undefined while it can be used.
  reason: string | undefined;
  onClick: () => void;
};

type DeleteItemProps = Omit<MenuActionItemProps, 'isDefault'>;

type EditItemProps = {
  collectionId: string;
  readOnlyReason: string | undefined;
};

const IS_DEFAULT_REASON = 'This is already the default collection.';
const DELETE_DEFAULT_REASON = 'The default collection cannot be deleted. Make another one the default first.';

// Edit opens the collection's dialog; a read-only user gets it disabled, saying why.
function EditItem({ collectionId, readOnlyReason }: EditItemProps) {
  if (readOnlyReason) {
    return (
      <DisabledReason reason={readOnlyReason} mode="wrapper" wrapperClassName="block">
        <DropdownMenuItem disabled>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
      </DisabledReason>
    );
  }

  return (
    <DropdownMenuItem render={<Link to={COLLECTION_ROUTES_PATHS.editInList(collectionId)} />}>
      <Pencil aria-hidden="true" />
      Edit
    </DropdownMenuItem>
  );
}

function MakeDefaultItem({ isDefault, reason, onClick }: MenuActionItemProps) {
  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem disabled={reason !== undefined} onClick={onClick}>
        <Star aria-hidden="true" fill={isDefault ? 'currentColor' : 'none'} />
        {isDefault ? 'Default' : 'Make default'}
      </DropdownMenuItem>
    </DisabledReason>
  );
}

function DeleteItem({ reason, onClick }: DeleteItemProps) {
  return (
    <DisabledReason reason={reason} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem variant="destructive" disabled={reason !== undefined} onClick={onClick}>
        <Trash2 aria-hidden="true" />
        Delete
      </DropdownMenuItem>
    </DisabledReason>
  );
}

// The ⋯ menu of one collection: edit, make default, export, delete. Export stays open to a read-only user.
function CollectionMenu({ collection, isBusy, onMakeDefault, onDelete }: Props) {
  const id = String(collection.id);
  const readOnlyReason = useReadOnlyReason();
  // In order: the account is read-only, the collection is the default, a change is running.
  const busyReason = reasonWhen(isBusy, DISABLED_REASONS.WORKING);
  const makeDefaultReason = firstReason(
    readOnlyReason,
    reasonWhen(collection.isDefault, IS_DEFAULT_REASON),
    busyReason,
  );
  const deleteReason = firstReason(readOnlyReason, reasonWhen(collection.isDefault, DELETE_DEFAULT_REASON), busyReason);

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <EditItem collectionId={id} readOnlyReason={readOnlyReason} />
        <MakeDefaultItem isDefault={collection.isDefault} reason={makeDefaultReason} onClick={onMakeDefault} />
        <ExportSubmenu collection={collection} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DeleteItem reason={deleteReason} onClick={onDelete} />
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

export default CollectionMenu;
