import type { NamedApiModel } from '@app-types/models';
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

type Props = {
  id?: string;
  tags: NamedApiModel[];
  value: NamedApiModel[];
  onChange: (tags: NamedApiModel[]) => void;
  placeholder?: string;
  'aria-describedby'?: string;
};

// Multi-select with chips over the existing tags: type to filter, Enter to pick, Backspace to drop the last chip.
function TagPicker({ id, tags, value, onChange, placeholder = 'Add a tag…', 'aria-describedby': describedBy }: Props) {
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      autoHighlight
      items={tags}
      value={value}
      onValueChange={(next) => onChange(next)}
      itemToStringLabel={(tag) => tag.name}
      isItemEqualToValue={(tag, other) => tag.id === other.id}
    >
      <ComboboxChips ref={anchor} aria-label="Tags">
        <ComboboxValue>
          {(selected: NamedApiModel[]) => (
            <>
              {selected.map((tag) => (
                <ComboboxChip key={tag.id} aria-description="Press Backspace to remove">
                  {tag.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                placeholder={selected.length === 0 ? placeholder : ''}
                aria-describedby={describedBy}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No tag with that name.</ComboboxEmpty>
        <ComboboxList>
          {(tag: NamedApiModel) => (
            <ComboboxItem key={tag.id} value={tag}>
              {tag.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default TagPicker;
