import type { LucideIcon } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import type { FunkoFormValues } from '../../funkoFormUtils';
import ReferenceSelectRow from './components/ReferenceSelectRow';
import type { ReferenceFieldName, ReferenceRow } from './types';

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

// A required dropdown of categories or series, with a "+" to create a missing one on the spot. The description and
// the error are both linked to the select.
function FunkoReferenceField({ control, name, id, label, description, ...selectProps }: Props) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <ReferenceSelectRow
            {...selectProps}
            field={field}
            id={id}
            isInvalid={fieldState.invalid}
            describedBy={fieldState.error ? `${descriptionId} ${errorId}` : descriptionId}
          />
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoReferenceField;
