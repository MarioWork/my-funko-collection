import type { CollectionItemApiModel } from '@app-types/models';
import type { FunkoGridDensityUtil } from '@app-types/utility';
import FunkoGrid from '@components/FunkoGrid';
import { useIsDesktop } from '@hooks/useIsDesktop';
import ItemCard from './ItemCard';
import ItemGridCard from './ItemGridCard';
import ItemTable from './ItemTable';

type Props = {
  items: CollectionItemApiModel[];
  // The grid's density, or null for the list layout.
  density: FunkoGridDensityUtil | null;
};

// The items in the chosen layout: a large or small grid, or a list (a table from `lg`, rows below it).
function ItemsResults({ items, density }: Props) {
  const isDesktop = useIsDesktop();

  if (density) {
    return (
      <FunkoGrid label="Items" density={density}>
        {items.map((item) => (
          <ItemGridCard key={item.id} item={item} density={density} />
        ))}
      </FunkoGrid>
    );
  }

  if (isDesktop) return <ItemTable items={items} />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default ItemsResults;
