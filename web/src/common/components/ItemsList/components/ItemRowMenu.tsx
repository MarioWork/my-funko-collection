import { FolderInput, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionApiModel, CollectionId, CollectionItemApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  item: CollectionItemApiModel;
  collections: CollectionApiModel[];
  editPath: string;
  isBusy: boolean;
  onMove: (toCollectionId: CollectionId) => void;
  onRemove: () => void;
  // Over a grid card's photo: a filled, smaller trigger so it stays visible on any picture.
  isOnPhoto?: boolean;
};

// Edit (sheet), move (submenu of the other collections), remove (undo toast, no dialog).
function ItemRowMenu({ item, collections, editPath, isBusy, onMove, onRemove, isOnPhoto = false }: Props) {
  const otherCollections = collections.filter((collection) => collection.id !== item.collection.id);

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
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link viewTransition to={editPath} />}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          {otherCollections.length > 0 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput aria-hidden="true" />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {otherCollections.map((collection) => (
                  <DropdownMenuItem key={collection.id} onClick={() => onMove(collection.id)}>
                    {collection.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <Trash2 aria-hidden="true" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ItemRowMenu;
