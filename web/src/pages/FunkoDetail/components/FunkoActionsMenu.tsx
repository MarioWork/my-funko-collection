import { ListChecks, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import DisabledReason from '@components/DisabledReason';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { useFunkoMemberships } from '../hooks/useFunkoMemberships';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
  onDelete: () => void;
};

type ListsSubmenuProps = Pick<Props, 'funko' | 'collections' | 'items'>;

// Every collection as a checkbox: ticked while the funko is in it, a tap adds or removes it.
function ListsSubmenu({ funko, collections, items }: ListsSubmenuProps) {
  const { memberIds, isBusy, toggle } = useFunkoMemberships({ funko, items });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ListChecks aria-hidden="true" />
        Lists
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {collections.map((collection) => (
          <DisabledReason
            key={collection.id}
            reason={reasonWhen(isBusy, DISABLED_REASONS.WORKING)}
            mode="wrapper"
            wrapperClassName="block"
          >
            <DropdownMenuCheckboxItem
              checked={memberIds.has(collection.id)}
              disabled={isBusy}
              onCheckedChange={() => toggle(collection)}
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          </DisabledReason>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

// The page header's ⋯: Edit, Lists (every collection) and Delete. Owned and Wishlist are one-tap toggles on the page.
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
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link viewTransition to={FUNKO_ROUTES_PATHS.edit(String(funko.id))} />}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <ListsSubmenu funko={funko} collections={collections} items={items} />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FunkoActionsMenu;
