import { useLoaderData } from 'react-router';
import type { CollectionApiModel, CollectionId, NamedApiModel } from '@app-types/models';
import CollectionPicker from '@components/CollectionPicker';
import TagPicker from '@components/TagPicker';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';

type Props = {
  idPrefix: string;
  // Off when editing: tags belong to each collection's item and are edited there.
  hasTags: boolean;
  initialCollectionIds: CollectionId[];
  collectionIds: CollectionId[];
  selectedTags: NamedApiModel[];
  onCollectionsChange: (collectionIds: CollectionId[]) => void;
  onTagsChange: (tags: NamedApiModel[]) => void;
};

// The options this form needs; the add and the edit loaders both return them under these names.
type DestinationOptions = {
  collections: CollectionApiModel[];
  tags: NamedApiModel[];
};

// "Save to collections" and, when adding, the tags for the new items. Taking a funko out of a collection it was
// in deletes its item there, so that is said before Save.
function FunkoDestinationFields({
  idPrefix,
  hasTags,
  initialCollectionIds,
  collectionIds,
  selectedTags,
  onCollectionsChange,
  onTagsChange,
}: Props) {
  const { collections, tags } = useLoaderData<DestinationOptions>();
  const tagsId = `${idPrefix}-tags`;
  const isTagsShown = hasTags && collectionIds.length > 0;
  const removedNames = collections
    .filter((collection) => initialCollectionIds.includes(collection.id) && !collectionIds.includes(collection.id))
    .map((collection) => collection.name);

  return (
    <div className="flex flex-col gap-5">
      <CollectionPicker
        id={`${idPrefix}-collections`}
        label="Save to collections"
        collections={collections}
        value={collectionIds}
        onChange={onCollectionsChange}
      />
      {removedNames.length > 0 ? (
        <p role="status" className="text-sm text-destructive">
          Saving removes it from {removedNames.join(', ')}, with its quantity, price, notes and tags there.
        </p>
      ) : null}
      {isTagsShown ? (
        <Field>
          <FieldLabel htmlFor={tagsId}>Tags</FieldLabel>
          <TagPicker
            id={tagsId}
            tags={tags}
            value={selectedTags}
            onChange={onTagsChange}
            placeholder="Box 3, shelf…"
            aria-describedby={`${tagsId}-description`}
          />
          <FieldDescription id={`${tagsId}-description`}>
            Put on its item in every collection picked above.
          </FieldDescription>
        </Field>
      ) : null}
    </div>
  );
}

export default FunkoDestinationFields;
