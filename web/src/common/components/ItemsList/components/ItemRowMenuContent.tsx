import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu';
import { useItemsListContext } from '../hooks/useItemsListContext';
import MoveToSubmenu from './MoveToSubmenu';

type Props = {
  item: CollectionItemApiModel;
};

function ItemRowMenuContent({ item }: Props) {
  const { collections, remove } = useItemsListContext();
  const editPath = COLLECTION_ROUTES_PATHS.editItem(String(item.collection.id), String(item.id));
  const otherCollections = collections.filter((collection) => collection.id !== item.collection.id);

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link viewTransition to={editPath} />}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {otherCollections.length > 0 ? <MoveToSubmenu item={item} collections={otherCollections} /> : null}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive" onClick={() => remove(item)}>
          <Trash2 aria-hidden="true" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

export default ItemRowMenuContent;
