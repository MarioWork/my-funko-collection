import type { CollectionApiModel, CollectionId, NamedApiModel } from '@app-types/models';
import CollectionPicker from '@components/CollectionPicker';
import type { ItemFormHandle } from '../hooks/useItemForms';
import CollectionItemCard from './CollectionItemCard';
import FormSection from './FormSection';

type Props = {
  collections: CollectionApiModel[];
  tags: NamedApiModel[];
  collectionIds: CollectionId[];
  // The tags a new card starts with: the ones used last time.
  initialTagIds: number[];
  isSubmitting: boolean;
  onCollectionsChange: (collectionIds: CollectionId[]) => void;
  onRegister: (collectionId: CollectionId, handle: ItemFormHandle) => () => void;
};

const SECTION_ID = 'add-collections';
const CATALOG_ONLY_MESSAGE = 'In no collection: it is saved to the catalog only.';

// Where the funko goes, and for each collection the details of that copy. A card per collection, in the
// collections' own order; removing a card is the same as unpicking the collection.
function AddCollectionsSection({
  collections,
  tags,
  collectionIds,
  initialTagIds,
  isSubmitting,
  onCollectionsChange,
  onRegister,
}: Props) {
  const chosen = collections.filter((collection) => collectionIds.includes(collection.id));

  const remove = (collectionId: CollectionId) =>
    onCollectionsChange(collectionIds.filter((candidate) => candidate !== collectionId));

  return (
    <FormSection
      id={SECTION_ID}
      title="Collections"
      description="Each collection gets its own copy: how many, condition, price, where it is."
    >
      <CollectionPicker
        id={`${SECTION_ID}-picker`}
        label="Add to collections"
        collections={collections}
        value={collectionIds}
        onChange={onCollectionsChange}
      />
      {chosen.length === 0 ? <p className="text-sm text-muted-foreground">{CATALOG_ONLY_MESSAGE}</p> : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {chosen.map((collection) => (
          <CollectionItemCard
            key={collection.id}
            collection={collection}
            tags={tags}
            initialTagIds={initialTagIds}
            isSubmitting={isSubmitting}
            onRegister={onRegister}
            onRemove={remove}
          />
        ))}
      </div>
    </FormSection>
  );
}

export default AddCollectionsSection;
