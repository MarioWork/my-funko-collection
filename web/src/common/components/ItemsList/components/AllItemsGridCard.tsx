import { Link } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { FunkoGridDensityUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';
import { cn } from '@utils/classNameUtils';
import { FUNKO_CARD_SIZES } from '@utils/layoutUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';
import { useItemsListContext } from '../hooks/useItemsListContext';
import { getAllItemsCardLines } from '../itemsListUtils';
import ItemRowMenu from './ItemRowMenu';

type Props = {
  item: CollectionItemApiModel;
  density: FunkoGridDensityUtil;
};

type PhotoProps = {
  item: CollectionItemApiModel;
};

type CaptionProps = {
  item: CollectionItemApiModel;
  isCompact: boolean;
};

// The photo with the collection as a tag in its top-left corner and "×N" bottom-right for more than one copy. Both
// are solid pills, so they stay readable on any photo.
function ItemPhoto({ item }: PhotoProps) {
  const hasExtraCopies = item.quantity > 1;

  return (
    <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-card shadow-xs transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary motion-reduce:transition-none">
      <FunkoImage
        image={item.funko.primaryImage}
        alt={item.funko.name}
        sizes={FUNKO_CARD_SIZES}
        className="size-full"
      />
      {/* Right padding keeps a long name clear of the ⋯ menu beside it. */}
      <div className="absolute inset-x-2 top-2 flex pr-9">
        <Badge variant="secondary" className="max-w-full truncate shadow-xs">
          {item.collection.name}
        </Badge>
      </div>
      {hasExtraCopies ? (
        <Badge className="absolute right-2 bottom-2" variant="default">
          ×{item.quantity}
        </Badge>
      ) : null}
    </div>
  );
}

// Under the photo, as plain lines: number and name, then the series, "Chase" and "Exclusive: <name>" when it has them.
function ItemCaption({ item, isCompact }: CaptionProps) {
  const { title, details } = getAllItemsCardLines(item);

  return (
    <span className="flex min-w-0 flex-col gap-0.5 px-0.5">
      <span className={cn('text-sm font-medium', isCompact ? 'truncate' : 'line-clamp-2')}>{title}</span>
      {details.map((detail) => (
        <span key={detail} className="truncate text-xs text-muted-foreground">
          {detail}
        </span>
      ))}
    </span>
  );
}

// An item on the All items page, where items from every collection sit side by side: the photo says which
// collection it is in and how many copies, the ⋯ menu sits on it, and under it plain lines name the funko (number
// and name), its series, and whether it is a chase or an exclusive. Nothing about the copy itself (price, tags,
// notes): those are in the list layout and the edit sheet. The whole card but the menu opens the funko.
function AllItemsGridCard({ item, density }: Props) {
  const { busyItemId } = useItemsListContext();
  const isBusy = busyItemId === item.id;
  const isCompact = density === FunkoGridDensityUtil.COMPACT;

  return (
    <li className={cn('relative', FADE_IN_CLASS, DIMMABLE_CLASS, isBusy && DIMMED_CLASS)}>
      <Link
        viewTransition
        to={FUNKO_ROUTES_PATHS.detail(String(item.funko.id))}
        className="group flex flex-col gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ItemPhoto item={item} />
        <ItemCaption item={item} isCompact={isCompact} />
      </Link>
      <div className="absolute top-2 right-2">
        <ItemRowMenu item={item} isOnPhoto />
      </div>
    </li>
  );
}

export default AllItemsGridCard;
