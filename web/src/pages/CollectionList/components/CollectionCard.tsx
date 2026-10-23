import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useFetcher } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmDialog from '@components/ConfirmDialog';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useActionToast } from '@hooks/useActionToast';
import DisabledReason from '@components/DisabledReason';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { CollectionLayoutUtil } from '../collectionListUtils';
import CollectionCardView from './CollectionCardView';
import CollectionTableRow from './CollectionTableRow';

type Props = {
  collection: CollectionApiModel;
  layout: CollectionLayoutUtil;
};

type MenuProps = {
  collection: CollectionApiModel;
  isBusy: boolean;
  onMakeDefault: () => void;
  onDelete: () => void;
};

const IS_DEFAULT_REASON = 'This is already the default collection.';
const DELETE_DEFAULT_REASON = 'The default collection cannot be deleted. Make another one the default first.';

function CollectionMenu({ collection, isBusy, onMakeDefault, onDelete }: MenuProps) {
  const id = String(collection.id);
  const busyReason = reasonWhen(isBusy, DISABLED_REASONS.WORKING);
  const makeDefaultReason = collection.isDefault ? IS_DEFAULT_REASON : busyReason;
  const deleteReason = collection.isDefault ? DELETE_DEFAULT_REASON : busyReason;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link viewTransition to={COLLECTION_ROUTES_PATHS.edit(id)} />}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DisabledReason reason={makeDefaultReason} mode="wrapper" wrapperClassName="block">
          <DropdownMenuItem disabled={collection.isDefault || isBusy} onClick={onMakeDefault}>
            <Star aria-hidden="true" fill={collection.isDefault ? 'currentColor' : 'none'} />
            {collection.isDefault ? 'Default' : 'Make default'}
          </DropdownMenuItem>
        </DisabledReason>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DisabledReason reason={deleteReason} mode="wrapper" wrapperClassName="block">
          <DropdownMenuItem variant="destructive" disabled={collection.isDefault || isBusy} onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DisabledReason>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

// One collection, as a card or a table row (same actions either way): name, default badge, counts, total and the ⋯
// menu (edit, make default, delete); the whole card links to the collection's items.
function CollectionCard({ collection, layout }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const id = String(collection.id);
  const isBusy = fetcher.state !== 'idle';

  const makeDefault = () =>
    void fetcher.submit(null, { method: HttpVerbsUtil.POST, action: COLLECTION_ROUTES_PATHS.setDefault(id) });
  const remove = () =>
    void fetcher.submit(null, { method: HttpVerbsUtil.DELETE, action: COLLECTION_ROUTES_PATHS.delete(id) });

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton aria-label={`Actions for ${collection.name}`} variant="ghost" />}>
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <CollectionMenu
        collection={collection}
        isBusy={isBusy}
        onMakeDefault={makeDefault}
        onDelete={() => setIsDeleteOpen(true)}
      />
    </DropdownMenu>
  );

  useActionToast(fetcher, {
    successMessage: () =>
      fetcher.formMethod === HttpVerbsUtil.DELETE
        ? `Deleted ${collection.name}`
        : `${collection.name} is now the default`,
  });

  const confirmDelete = (
    <ConfirmDialog
      isOpen={isDeleteOpen}
      title={`Delete ${collection.name}?`}
      description="Its items are removed from this list. The funkos themselves stay in your catalog."
      confirmLabel="Delete"
      isDestructive
      isPending={isBusy}
      onConfirm={() => {
        setIsDeleteOpen(false);
        remove();
      }}
      onClose={() => setIsDeleteOpen(false)}
    />
  );

  // A table row has no list item around it; the dialog renders in a portal, so it can sit beside the row.
  if (layout === CollectionLayoutUtil.LIST) {
    return (
      <>
        <CollectionTableRow collection={collection} menu={menu} />
        {confirmDelete}
      </>
    );
  }

  return (
    <li>
      <CollectionCardView collection={collection} menu={menu} />
      {confirmDelete}
    </li>
  );
}

export default CollectionCard;
