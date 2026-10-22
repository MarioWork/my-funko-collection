import type { CollectionApiModel, NamedApiModel } from '@app-types/models';
import TagPicker from '@components/TagPicker';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { CATALOG_ONLY_LABEL, CATALOG_ONLY_VALUE } from '@utils/addDestinationUtils';

type Props = {
  collections: CollectionApiModel[];
  tags: NamedApiModel[];
  collectionId: number | null;
  selectedTags: NamedApiModel[];
  onCollectionChange: (id: number | null) => void;
  onTagsChange: (tags: NamedApiModel[]) => void;
};

const COLLECTION_ID = 'add-collection';
const TAGS_ID = 'add-tags';

// "Adding to: Owned · Box 3", or just the catalog. Picked once, kept until changed, so scanning a shelf is one tap
// per box.
function AddDestination({ collections, tags, collectionId, selectedTags, onCollectionChange, onTagsChange }: Props) {
  const isCatalogOnly = collectionId === null;

  return (
    <section aria-label="Adding to" className="grid gap-3 rounded-xl border bg-card p-3 @md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={COLLECTION_ID}>Adding to</FieldLabel>
        <NativeSelect
          id={COLLECTION_ID}
          value={isCatalogOnly ? CATALOG_ONLY_VALUE : String(collectionId)}
          onChange={(event) =>
            onCollectionChange(event.target.value === CATALOG_ONLY_VALUE ? null : Number(event.target.value))
          }
        >
          {collections.map((collection) => (
            <NativeSelectOption key={collection.id} value={String(collection.id)}>
              {collection.name}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value={CATALOG_ONLY_VALUE}>{CATALOG_ONLY_LABEL}</NativeSelectOption>
        </NativeSelect>
        {isCatalogOnly ? (
          <FieldDescription>Registered only; put it in a list later from its page.</FieldDescription>
        ) : null}
      </Field>
      {isCatalogOnly ? null : (
        <Field>
          <FieldLabel htmlFor={TAGS_ID}>With tags</FieldLabel>
          <TagPicker
            id={TAGS_ID}
            tags={tags}
            value={selectedTags}
            onChange={onTagsChange}
            placeholder="Box 3, shelf…"
          />
        </Field>
      )}
    </section>
  );
}

export default AddDestination;
