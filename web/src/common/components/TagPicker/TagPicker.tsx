import { Tag } from 'lucide-react';
import { useState } from 'react';
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
import { useCreateNamed } from '@hooks/useCreateNamed';

type Props = {
  id?: string;
  tags: NamedApiModel[];
  value: NamedApiModel[];
  onChange: (tags: NamedApiModel[]) => void;
  placeholder?: string;
  'aria-describedby'?: string;
  // Set to offer "Create “…”" for a name no tag has yet: the tags list route, whose action creates it.
  createActionPath?: string;
};

// A tag in the list, or the "Create “…”" entry for the name being typed.
type TagOption = NamedApiModel & { isCreate?: boolean };

// Never a real id: marks the "Create “…”" entry.
const CREATE_OPTION_ID = -1;

type OptionLabelProps = {
  option: TagOption;
};

function OptionLabel({ option }: OptionLabelProps) {
  if (!option.isCreate) return <>{option.name}</>;

  return (
    <>
      <Tag aria-hidden="true" />
      Create &ldquo;{option.name}&rdquo;
    </>
  );
}

// Multi-select with chips over the existing tags: type to filter, Enter to pick, Backspace to drop the last chip.
// With a create path, a name no tag has yet can be created right here and is picked as soon as it exists.
function TagPicker({
  id,
  tags,
  value,
  onChange,
  placeholder = 'Add a tag…',
  'aria-describedby': describedBy,
  createActionPath,
}: Props) {
  const anchor = useComboboxAnchor();
  const [inputValue, setInputValue] = useState('');
  const { create } = useCreateNamed({
    actionPath: createActionPath ?? '',
    onCreated: (created) => onChange([...value, created]),
  });
  const typedName = inputValue.trim();
  const isExistingName = tags.some((tag) => tag.name.toLowerCase() === typedName.toLowerCase());
  const canCreate = createActionPath !== undefined && typedName.length > 0 && !isExistingName;
  const items: TagOption[] = canCreate ? [...tags, { id: CREATE_OPTION_ID, name: typedName, isCreate: true }] : tags;

  const handleValueChange = (next: TagOption[]) => {
    const createOption = next.find((option) => option.isCreate);
    const picked = next.filter((option) => !option.isCreate);

    if (createOption) {
      create(createOption.name);
      setInputValue('');
    }

    onChange(picked);
  };

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={value}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onValueChange={handleValueChange}
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
          {(option: TagOption) => (
            <ComboboxItem key={option.id} value={option}>
              <OptionLabel option={option} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default TagPicker;
