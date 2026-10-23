import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, CollectionLayoutUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import CollectionSummaryCard from '@components/CollectionSummaryCard';
import ConfirmDialog from '@components/ConfirmDialog';
import IconButton from '@components/IconButton';
import { DropdownMenu, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { useActionToast } from '@hooks/useActionToast';
import CollectionMenu from './CollectionMenu';
import CollectionTableRow from './CollectionTableRow';

type Props = {
  collection: CollectionApiModel;
  layout: CollectionLayoutUtil;
};

const NO_NOTES = 'No notes';

// One collection, as a card or a table row (same actions either way): name, default badge, counts, total and the ⋯
// menu (edit, make default, export, delete); the whole card links to the collection's items.
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
      <CollectionSummaryCard collection={collection} description={collection.notes ?? NO_NOTES} menu={menu} />
      {confirmDelete}
    </li>
  );
}

export default CollectionCard;
