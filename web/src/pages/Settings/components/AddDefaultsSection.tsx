import type { CollectionApiModel, TagApiModel } from '@app-types/models';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import CollectionPicker from '@components/CollectionPicker';
import TagPicker from '@components/TagPicker';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { useAddDestination } from '@hooks/useAddDestination';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import SettingsSection from './SettingsSection';

type Props = {
  collections: CollectionApiModel[];
  tags: TagApiModel[];
};

const COLLECTIONS_ID = 'add-default-collections';
const TAGS_ID = 'add-default-tags';

// Where "Add" puts things on this device: collections and tags, kept in the browser, changeable on the Add page too.
// Picking stays open to a read-only user (it is only this browser's setting); creating a new tag does not.
function AddDefaultsSection({ collections, tags }: Props) {
  const isReadOnly = useReadOnlyReason() !== undefined;
  const { destination, isCatalogOnly, selectedTags, setCollectionIds, setTags } = useAddDestination({
    collections,
    tags,
  });

  return (
    <SettingsSection title="Adding to" description="Where a scanned or typed funko goes. Kept on this device.">
      <CollectionPicker
        id={COLLECTIONS_ID}
        label="Save to collections"
        collections={collections}
        value={destination.collectionIds}
        onChange={setCollectionIds}
      />
      {isCatalogOnly ? null : (
        <Field>
          <FieldLabel htmlFor={TAGS_ID}>Tags</FieldLabel>
          <TagPicker
            createActionPath={isReadOnly ? undefined : TAG_ROUTES_PATHS.BASE}
            id={TAGS_ID}
            tags={tags}
            value={selectedTags}
            onChange={setTags}
          />
          <FieldDescription>Put on every new item, like the box you are filling right now.</FieldDescription>
        </Field>
      )}
    </SettingsSection>
  );
}

export default AddDefaultsSection;
