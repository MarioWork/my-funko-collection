import type { CollectionApiModel, TagApiModel } from '@app-types/models';
import TagPicker from '@components/TagPicker';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { useAddDestination } from '@hooks/useAddDestination';
import { CATALOG_ONLY_LABEL, CATALOG_ONLY_VALUE } from '@utils/addDestinationUtils';
import SettingsSection from './SettingsSection';

type Props = {
  collections: CollectionApiModel[];
  tags: TagApiModel[];
};

const COLLECTION_ID = 'add-default-collection';
const TAGS_ID = 'add-default-tags';

// Where "Add" puts things on this device: collection and tags, kept in the browser, changeable on the Add page too.
function AddDefaultsSection({ collections, tags }: Props) {
  const { collection, isCatalogOnly, selectedTags, setCollectionId, setTags } = useAddDestination({
    collections,
    tags,
  });

  return (
    <SettingsSection title="Adding to" description="Where a scanned or typed funko goes. Kept on this device.">
      <Field>
        <FieldLabel htmlFor={COLLECTION_ID}>Collection</FieldLabel>
        <NativeSelect
          id={COLLECTION_ID}
          value={isCatalogOnly ? CATALOG_ONLY_VALUE : String(collection?.id ?? '')}
          onChange={(event) =>
            setCollectionId(event.target.value === CATALOG_ONLY_VALUE ? null : Number(event.target.value))
          }
        >
          {collections.map((candidate) => (
            <NativeSelectOption key={candidate.id} value={String(candidate.id)}>
              {candidate.name}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value={CATALOG_ONLY_VALUE}>{CATALOG_ONLY_LABEL}</NativeSelectOption>
        </NativeSelect>
      </Field>
      {isCatalogOnly ? null : (
        <Field>
          <FieldLabel htmlFor={TAGS_ID}>Tags</FieldLabel>
          <TagPicker id={TAGS_ID} tags={tags} value={selectedTags} onChange={setTags} />
          <FieldDescription>Put on every new item, like the box you are filling right now.</FieldDescription>
        </Field>
      )}
    </SettingsSection>
  );
}

export default AddDefaultsSection;
