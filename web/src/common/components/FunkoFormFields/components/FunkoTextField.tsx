import { Controller, type Control } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { FunkoFormValues } from '../funkoFormUtils';

type TextFieldName = 'name' | 'number' | 'exclusive';

type TextFieldInputMode = 'numeric' | 'text';

type Props = {
  control: Control<FunkoFormValues>;
  name: TextFieldName;
  id: string;
  label: string;
  placeholder?: string;
  inputMode?: TextFieldInputMode;
};

// One text input of the funko form (name, number, exclusive), its error linked to it.
function FunkoTextField({ control, name, id, label, placeholder, inputMode }: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            inputMode={inputMode}
            placeholder={placeholder}
            autoComplete="off"
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          />
          <FieldError id={`${id}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoTextField;
