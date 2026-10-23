import type { CollectionApiModel, CollectionItemApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoCard from '@components/FunkoCard';
import type { FunkoGridDensity } from '@utils/layoutUtils';
import ItemRowMenu from './ItemRowMenu';

type Props = {
  item: CollectionItemApiModel;
  collections: CollectionApiModel[];
  density: FunkoGridDensity;
  isBusy: boolean;
  onMove: (item: CollectionItemApiModel, toCollectionId: number) => void;
  onRemove: (item: CollectionItemApiModel) => void;
};

// An item in the grid layouts: the funko's card (with how many copies) and the item's ⋯ menu over the photo.
function ItemGridCard({ item, collections, density, isBusy, onMove, onRemove }: Props) {
  return (
    <li className="relative">
      <FunkoCard funko={item.funko} quantity={item.quantity} density={density} />
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
