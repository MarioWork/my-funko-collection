import { Controller, type Control } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { FunkoFormValues } from '../funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  id: string;
  // Rendered beside the input, e.g. a Scan button.
  addon?: React.ReactNode;
};

function FunkoBarcodeField({ control, id, addon }: Props) {
  return (
    <Controller
      control={control}
      name="barcode"
      render={({ field: { value, ...field }, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Barcode (optional)</FieldLabel>
          <div className="flex gap-2">
            <Input
              {...field}
              value={value ?? ''}
              id={id}
              inputMode="numeric"
              autoComplete="off"
              placeholder="889698…"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${id}-error` : undefined}
            />
            {addon}
          </div>
          <FieldError id={`${id}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoBarcodeField;
