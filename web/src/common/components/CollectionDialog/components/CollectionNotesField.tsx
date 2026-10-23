import { Controller, type Control } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Textarea } from '@components/ui/textarea';
import type { CollectionFormValues } from '../collectionFormUtils';

type Props = {
  control: Control<CollectionFormValues>;
  idPrefix: string;
};

const NOTES_ROWS = 2;

function CollectionNotesField({ control, idPrefix }: Props) {
  const id = `${idPrefix}-notes`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name="notes"
      render={({ field: { value, ...field }, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Notes (optional)</FieldLabel>
          <Textarea
            {...field}
            value={value ?? ''}
            id={id}
            rows={NOTES_ROWS}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? errorId : undefined}
          />
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default CollectionNotesField;
