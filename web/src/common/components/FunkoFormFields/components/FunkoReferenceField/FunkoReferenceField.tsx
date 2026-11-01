import type { LucideIcon } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import type { CategoryApiModel } from '@app-types/models';
import CreateNamedButton from '@components/CreateNamedButton';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { referenceOptionLabel, type FunkoFormValues } from '../../funkoFormUtils';

// The two fields that point at a category or a series; both are required.
type ReferenceFieldName = 'categoryId' | 'seriesId';

// A category or series as the dropdown lists it (a series has the same shape).
type ReferenceRow = Pick<CategoryApiModel, 'id' | 'name' | 'status'>;

type Props = {
  control: Control<FunkoFormValues>;
  name: ReferenceFieldName;
  id: string;
  label: string;
  // The placeholder option, shown until one is picked: "Pick a line…".
  placeholder: string;
  description: React.ReactNode;
  rows: ReferenceRow[];
  // "category", "series": names the "+" button and its field.
  noun: string;
  icon: LucideIcon;
  // Where the "+" creates a new one: the category or series list's action.
  createPath: string;
};

// The placeholder option's value: nothing picked yet, which the form refuses.
const NOTHING_PICKED = '';

// A required dropdown of categories or series, with a "+" to create a missing one on the spot (picked as soon as it
// exists). The description and the error are both linked to the select.
function FunkoReferenceField({
  control,
  name,
  id,
  label,
  placeholder,
  description,
  rows,
  noun,
  icon,
  createPath,
}: Props) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <div className="flex gap-2">
            <NativeSelect
              {...field}
              id={id}
              className="flex-1"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${descriptionId} ${errorId}` : descriptionId}
            >
              <NativeSelectOption value={NOTHING_PICKED}>{placeholder}</NativeSelectOption>
              {rows.map((row) => (
                <NativeSelectOption key={row.id} value={String(row.id)}>
                  {referenceOptionLabel(row)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <CreateNamedButton
              icon={icon}
              noun={noun}
              actionPath={createPath}
              onCreated={(created) => field.onChange(String(created.id))}
            />
          </div>
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoReferenceField;
