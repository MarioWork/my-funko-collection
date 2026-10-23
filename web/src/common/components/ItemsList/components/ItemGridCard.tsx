import type { CollectionApiModel, CollectionItemApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoCard from '@components/FunkoCard';
import type { FunkoGridDensity } from '@utils/layoutUtils';
import ItemGridFacts from './ItemGridFacts';
import ItemRowMenu from './ItemRowMenu';

type Props = {
  item: CollectionItemApiModel;
  collections: CollectionApiModel[];
  density: FunkoGridDensity;
  isBusy: boolean;
  onMove: (item: CollectionItemApiModel, toCollectionId: number) => void;
  onRemove: (item: CollectionItemApiModel) => void;
};

// An item in the grid layouts: the funko's card (with how many copies), the item's ⋯ menu over the photo and, in
// the large grid, the copy's condition, price and tags.
function ItemGridCard({ item, collections, density, isBusy, onMove, onRemove }: Props) {
  // The small grid stays photo and name for scanning a shelf; the large one also shows the copy's facts.
  const isLargeGrid = density === 'comfortable';

  return (
    <li className="relative">
      <FunkoCard funko={item.funko} quantity={item.quantity} density={density} />
      {isLargeGrid ? <ItemGridFacts item={item} /> : null}
      <div className="absolute top-2 right-2">
        <ItemRowMenu
          item={item}
          collections={collections}
          editPath={COLLECTION_ROUTES_PATHS.editItem(String(item.collection.id), String(item.id))}
          isBusy={isBusy}
          onMove={(toCollectionId) => onMove(item, toCollectionId)}
          onRemove={() => onRemove(item)}
          isOnPhoto
        />
      </div>
    </li>
  );
}

export default ItemGridCard;
