import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Textarea } from '@components/ui/textarea';

// Any form whose one field is the reason someone else reads.
type ReasonFormValues = {
  reason: string;
};

type Props = {
  control: Control<ReasonFormValues>;
  idPrefix: string;
  // Who reads the reason, and where.
  hint: string;
};

const REASON_ROWS = 3;

// "Why?": the reason an admin gives for a rejection or a removal, with who reads it under the box.
function ReasonField({ control, idPrefix, hint }: Props) {
  const id = `${idPrefix}-reason`;
  const hintId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name="reason"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Why?</FieldLabel>
          <Textarea
            {...field}
            id={id}
            rows={REASON_ROWS}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? `${hintId} ${errorId}` : hintId}
          />
          <FieldDescription id={hintId}>{hint}</FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default ReasonField;
