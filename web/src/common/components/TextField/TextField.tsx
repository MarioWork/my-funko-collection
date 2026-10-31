import type { ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';

type TextFieldType = 'text' | 'password';

type Props<Values extends FieldValues> = {
  control: Control<Values>;
  // A field that holds a string.
  name: Path<Values>;
  label: string;
  idPrefix: string;
  type?: TextFieldType;
  description?: ReactNode;
  placeholder?: string;
  // Password managers find the fields by these: "username", "current-password", "new-password".
  autoComplete?: string;
  // The API's answer about this field (a common password), shown like a validation error.
  serverError?: string;
  // Off for usernames and passwords: no capital first letter or spelling fix on phones.
  isPlainText?: boolean;
};

// One labelled text field of a react-hook-form form, its hint and its error tied to the input.
function TextField<Values extends FieldValues>({
  control,
  name,
  label,
  idPrefix,
  type = 'text',
  description,
  placeholder,
  autoComplete,
  serverError,
  isPlainText = false,
}: Props<Values>) {
  const inputId = `${idPrefix}-${name}`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, ...field }, fieldState }) => {
        const error = fieldState.error ?? (serverError ? { message: serverError } : undefined);
        const isInvalid = error !== undefined;
        const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean);

        return (
          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            <Input
              {...field}
              value={value ?? ''}
              id={inputId}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoCapitalize={isPlainText ? 'none' : undefined}
              autoCorrect={isPlainText ? 'off' : undefined}
              spellCheck={isPlainText ? false : undefined}
              aria-invalid={isInvalid || undefined}
              aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
            />
            {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
            <FieldError id={errorId} errors={error ? [error] : undefined} />
          </Field>
        );
      }}
    />
  );
}

export default TextField;
