import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { AddPasskeyFormValues } from '../../../settingsUtils';

type Props = {
  control: Control<AddPasskeyFormValues>;
  idPrefix: string;
};

function PasskeyNameField({ control, idPrefix }: Props) {
  const inputId = `${idPrefix}-name`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={inputId}>Name</FieldLabel>
          <Input
            {...field}
            id={inputId}
            placeholder="iPhone, Bitwarden, YubiKey…"
            autoComplete="off"
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? `${descriptionId} ${errorId}` : descriptionId}
          />
          <FieldDescription id={descriptionId}>Where it lives, so you can tell your passkeys apart.</FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default PasskeyNameField;
