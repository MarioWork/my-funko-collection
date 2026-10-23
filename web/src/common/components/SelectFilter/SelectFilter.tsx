import { Field, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';

export type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  label: string;
  value: string | undefined;
  // The first option, which clears the filter: "Any category".
  anyLabel: string;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
};

const ANY = '';

// One filter in a filters panel. Native selects: one tap on phone opens the OS picker, which beats a custom list
// for 5–30 options.
function SelectFilter({ id, label, value, anyLabel, options, onChange }: Props) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect id={id} value={value ?? ANY} onChange={(event) => onChange(event.target.value || undefined)}>
        <NativeSelectOption value={ANY}>{anyLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

export default SelectFilter;
