import { FolderInput } from 'lucide-react';
import type { CollectionApiModel, CollectionItemApiModel } from '@app-types/models';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@components/ui/dropdown-menu';
import { useItemsListContext } from '../hooks/useItemsListContext';

type Props = {
  item: CollectionItemApiModel;
  // Every collection except the item's own.
  collections: CollectionApiModel[];
};

function MoveToSubmenu({ item, collections }: Props) {
  const { move } = useItemsListContext();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <FolderInput aria-hidden="true" />
        Move to
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {collections.map((collection) => (
          <DropdownMenuItem key={collection.id} onClick={() => move(item, collection.id)}>
            {collection.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export default MoveToSubmenu;
