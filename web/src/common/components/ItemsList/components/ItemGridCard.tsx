import type { CollectionItemApiModel } from '@app-types/models';
import FunkoCard from '@components/FunkoCard';
import { FunkoGridDensityUtil } from '@app-types/utility';
import { useItemsListContext } from '../hooks/useItemsListContext';
import ItemGridFacts from './ItemGridFacts';
import ItemRowMenu from './ItemRowMenu';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';

type Props = {
  item: CollectionItemApiModel;
  density: FunkoGridDensityUtil;
};

// An item in the grid layouts: the funko's card (with how many copies), the item's ⋯ menu over the photo and, in
// the large grid, the copy's condition, price and tags.
function ItemGridCard({ item, density }: Props) {
  const { busyItemId } = useItemsListContext();
  const isBusy = busyItemId === item.id;
  // The small grid stays photo and name for scanning a shelf; the large one also shows the copy's facts.
  const isLargeGrid = density === FunkoGridDensityUtil.COMFORTABLE;

  return (
    <li className={cn('relative', FADE_IN_CLASS, DIMMABLE_CLASS, isBusy && DIMMED_CLASS)}>
      <FunkoCard funko={item.funko} quantity={item.quantity} density={density} />
      {isLargeGrid ? <ItemGridFacts item={item} /> : null}
      <div className="absolute top-2 right-2">
        <ItemRowMenu item={item} isOnPhoto />
      </div>
    </li>
  );
}

export default ItemGridCard;
