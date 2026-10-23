import { useLoaderData } from 'react-router';
import type { CollectionApiModel, CollectionId } from '@app-types/models';
import CollectionPicker from '@components/CollectionPicker';

type Props = {
  idPrefix: string;
  initialCollectionIds: CollectionId[];
  collectionIds: CollectionId[];
  onChange: (collectionIds: CollectionId[]) => void;
};

// The options this field needs; the edit loader returns them under this name.
type CollectionOptions = {
  collections: CollectionApiModel[];
};

// The collections the funko is in. Taking it out of one deletes its item there, so that is said before Save.
function FunkoCollectionsField({ idPrefix, initialCollectionIds, collectionIds, onChange }: Props) {
  const { collections } = useLoaderData<CollectionOptions>();
  const removedNames = collections
    .filter((collection) => initialCollectionIds.includes(collection.id) && !collectionIds.includes(collection.id))
    .map((collection) => collection.name);

  return (
    <div className="flex flex-col gap-2">
      <CollectionPicker
        id={`${idPrefix}-collections`}
        label="In collections"
        collections={collections}
        value={collectionIds}
        onChange={onChange}
      />
      {removedNames.length > 0 ? (
        <p role="status" className="text-sm text-destructive">
          Saving removes it from {removedNames.join(', ')}, with its quantity, price, notes and tags there.
        </p>
      ) : null}
    </div>
  );
}

export default FunkoCollectionsField;
