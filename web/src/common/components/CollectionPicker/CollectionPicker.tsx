import type { CollectionApiModel, CollectionId } from '@app-types/models';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@components/ui/combobox';
import InfoHint from '@components/InfoHint';
import { Field, FieldLabel } from '@components/ui/field';

type Props = {
  id: string;
  label: string;
  collections: CollectionApiModel[];
  value: CollectionId[];
  onChange: (collectionIds: CollectionId[]) => void;
};

// Multi-select with chips over the collections: type to filter, Enter to pick, Backspace to drop the last chip.
// None picked means the funko only goes in the catalog.
function CollectionPicker({ id, label, collections, value, onChange }: Props) {
  const anchor = useComboboxAnchor();
  const selected = collections.filter((collection) => value.includes(collection.id));

  return (
    <Field>
      <div className="flex items-center gap-1">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <InfoHint label={`About ${label.toLowerCase()}`}>If none is selected, it saves to the catalog only.</InfoHint>
      </div>
      <Combobox
        multiple
        autoHighlight
        items={collections}
        value={selected}
        onValueChange={(next) => onChange(next.map((collection) => collection.id))}
        itemToStringLabel={(collection) => collection.name}
        isItemEqualToValue={(collection, other) => collection.id === other.id}
      >
        <ComboboxChips ref={anchor} aria-label={label}>
          <ComboboxValue>
            {(chosen: CollectionApiModel[]) => (
              <>
                {chosen.map((collection) => (
                  <ComboboxChip key={collection.id} aria-description="Press Backspace to remove">
                    {collection.name}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput id={id} placeholder={chosen.length === 0 ? 'Pick collections…' : ''} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No collection with that name.</ComboboxEmpty>
          <ComboboxList>
            {(collection: CollectionApiModel) => (
              <ComboboxItem key={collection.id} value={collection}>
                {collection.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

export default CollectionPicker;
