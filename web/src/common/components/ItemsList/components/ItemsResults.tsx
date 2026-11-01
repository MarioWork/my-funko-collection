import { ViewTransition } from 'react';
import type { CollectionItemApiModel } from '@app-types/models';
import type { FunkoGridDensityUtil } from '@app-types/utility';
import FunkoGrid from '@components/FunkoGrid';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { LIST_ITEM_TRANSITION_CLASS } from '@utils/motionUtils';
import { useItemsListContext } from '../hooks/useItemsListContext';
import AllItemsGridCard from './AllItemsGridCard';
import ItemCard from './ItemCard';
import ItemGridCard from './ItemGridCard';
import ItemTable from './ItemTable';

type Props = {
  items: CollectionItemApiModel[];
  // The grid's density, or null for the list layout.
  density: FunkoGridDensityUtil | null;
};

// The items in the chosen layout: a large or small grid (All items cards across collections, item cards inside one), or a list (a table from `lg`, rows below it). Each item
// is a <ViewTransition>, so one removed (or put back by Undo) fades and the others slide into place.
function ItemsResults({ items, density }: Props) {
  const isDesktop = useIsDesktop();
  // Across every collection (All items), a card says which collection; inside one, the card shows the copy's facts.
  const { hasCollectionFilter } = useItemsListContext();
  const GridCard = hasCollectionFilter ? AllItemsGridCard : ItemGridCard;

  if (density) {
    return (
      <FunkoGrid label="Items" density={density}>
        {items.map((item) => (
          <ViewTransition key={item.id} default={LIST_ITEM_TRANSITION_CLASS}>
            <GridCard item={item} density={density} />
          </ViewTransition>
        ))}
      </FunkoGrid>
    );
  }

  if (isDesktop) return <ItemTable items={items} />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <ViewTransition key={item.id} default={LIST_ITEM_TRANSITION_CLASS}>
          <ItemCard item={item} />
        </ViewTransition>
      ))}
    </ul>
  );
}

export default ItemsResults;
