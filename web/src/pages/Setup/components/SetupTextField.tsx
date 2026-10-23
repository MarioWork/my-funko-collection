import type { ReactNode } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { SetupFormValues } from '../setupUtils';

type Props = {
  control: Control<SetupFormValues>;
  name: keyof SetupFormValues;
  label: string;
  description?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
  idPrefix: string;
};

// One labelled text field of the first-run form, with its hint and its error tied to the input.
function SetupTextField({ control, name, label, description, placeholder, autoComplete, idPrefix }: Props) {
  const inputId = `${idPrefix}-${name}`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, ...field }, fieldState }) => {
        const describedBy = [description ? descriptionId : null, fieldState.error ? errorId : null].filter(Boolean);

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            <Input
              {...field}
              value={value ?? ''}
              id={inputId}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
            />
            {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
            <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        );
      }}
    />
  );
}

export default SetupTextField;
