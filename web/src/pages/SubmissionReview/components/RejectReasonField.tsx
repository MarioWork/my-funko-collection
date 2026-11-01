import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Textarea } from '@components/ui/textarea';
import type { RejectSubmissionFormValues } from '../submissionReviewUtils';

type Props = {
  control: Control<RejectSubmissionFormValues>;
  idPrefix: string;
};

const REASON_ROWS = 3;
const REASON_HINT = 'The member reads this on their Submissions page.';

function RejectReasonField({ control, idPrefix }: Props) {
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
          <FieldDescription id={hintId}>{REASON_HINT}</FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default RejectReasonField;
