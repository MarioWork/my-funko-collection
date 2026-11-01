import type { CollectionItemApiModel } from '@app-types/models';
import { FunkoGridDensityUtil } from '@app-types/utility';
import FunkoCardFrame from '@components/FunkoCardFrame';
import { Badge } from '@components/ui/badge';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';
import { useItemsListContext } from '../hooks/useItemsListContext';
import { getAllItemsCardLines } from '../itemsListUtils';
import ItemRowMenu from './ItemRowMenu';

type Props = {
  item: CollectionItemApiModel;
  density: FunkoGridDensityUtil;
};

type CollectionTagProps = {
  name: string;
};

// The item's collection in the photo's top-left corner: a solid pill with a hairline edge, readable on any photo.
// The right padding keeps a long name clear of the ⋯ menu beside it.
function CollectionTag({ name }: CollectionTagProps) {
  return (
    <div className="absolute inset-x-2 top-2 flex pr-9">
      <Badge variant="secondary" className="max-w-full truncate shadow-xs ring-1 ring-border">
        {name}
      </Badge>
    </div>
  );
}

// An item on the All items page, where items from every collection sit side by side: on the photo its collection,
// the ⋯ menu and "×N" for more than one copy; under it, as plain lines, the funko's number and name, its series,
// and "Chase" / "Exclusive: <name>" when it has them. Nothing about the copy itself (category, price, tags, notes):
// those are in the list layout and the edit sheet. The whole card but the menu opens the funko.
function AllItemsGridCard({ item, density }: Props) {
  const { busyItemId } = useItemsListContext();
  const isBusy = busyItemId === item.id;
  const isCompact = density === FunkoGridDensityUtil.COMPACT;
  const { title, details } = getAllItemsCardLines(item);

  return (
    <li className={cn('relative', FADE_IN_CLASS, DIMMABLE_CLASS, isBusy && DIMMED_CLASS)}>
      <FunkoCardFrame
        funko={item.funko}
        quantity={item.quantity}
        photoCorner={<CollectionTag name={item.collection.name} />}
      >
        <span className={cn('text-sm font-medium', isCompact ? 'truncate' : 'line-clamp-2')}>{title}</span>
        {details.map((detail) => (
          <span key={detail} className="truncate text-xs text-muted-foreground">
            {detail}
          </span>
        ))}
      </FunkoCardFrame>
      <div className="absolute top-2 right-2">
        <ItemRowMenu item={item} isOnPhoto />
      </div>
    </li>
  );
}

export default AllItemsGridCard;
