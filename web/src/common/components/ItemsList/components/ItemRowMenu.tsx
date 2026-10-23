import { MoreHorizontal } from 'lucide-react';
import type { CollectionItemApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import { DropdownMenu, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { useItemsListContext } from '../hooks/useItemsListContext';
import ItemRowMenuContent from './ItemRowMenuContent';

type Props = {
  item: CollectionItemApiModel;
  // Over a grid card's photo: a filled, smaller trigger so it stays visible on any picture.
  isOnPhoto?: boolean;
};

// Edit (sheet), move (submenu of the other collections), remove (undo toast, no dialog).
function ItemRowMenu({ item, isOnPhoto = false }: Props) {
  const { busyItemId } = useItemsListContext();
  const isBusy = busyItemId === item.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            aria-label={`Actions for ${item.funko.name}`}
            variant={isOnPhoto ? 'secondary' : 'ghost'}
            size={isOnPhoto ? 'sm' : 'md'}
            disabled={isBusy}
            disabledReason={DISABLED_REASONS.WORKING}
          />
        }
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <ItemRowMenuContent item={item} />
    </DropdownMenu>
  );
}

export default ItemRowMenu;
