import { MoreHorizontal } from 'lucide-react';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import { DropdownMenu, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import FunkoActionsMenuContent from './FunkoActionsMenuContent';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
  onDelete: () => void;
};

// The page header's ⋯: Edit, Lists (every collection), Export and Delete. Owned and Wishlist are one-tap toggles
// on the page.
function FunkoActionsMenu({ funko, collections, items, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            aria-label={`Actions for ${funko.name}`}
            variant="outline"
            hasTooltip={false}
            className="size-9 rounded-full border-input bg-card"
          />
        }
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <FunkoActionsMenuContent funko={funko} collections={collections} items={items} onDelete={onDelete} />
    </DropdownMenu>
  );
}

export default FunkoActionsMenu;
