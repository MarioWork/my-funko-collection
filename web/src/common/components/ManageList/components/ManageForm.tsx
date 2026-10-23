import { yupResolver } from '@hookform/resolvers/yup';
import { Check, X } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { ApiError } from '@app-types/models';
import IconButton from '@components/IconButton';
import InlineAlert from '@components/InlineAlert';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { cn } from '@utils/classNameUtils';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { manageFormSchema, type ManageFormValues } from '../manageListUtils';

type Props = {
  idPrefix: string;
  defaultValues: ManageFormValues;
  hasNotes: boolean;
  submitLabel: string;
  isSubmitting: boolean;
  failure?: ApiError;
  onSubmit: (values: ManageFormValues) => void;
  onCancel?: () => void;
  // Set when the buttons live outside the form (a FormPanel footer submits it through this id).
  formId?: string;
  className?: string;
};

// The fields (name, optional notes) and, unless a FormPanel footer carries them, ✓ / ✕ icon buttons (named Save /
// Cancel for assistive tech and in their tooltips). Renames inline in a
// row; adds inside ManageAddPanel.
function ManageForm({
  idPrefix,
  defaultValues,
  hasNotes,
  submitLabel,
  isSubmitting,
  failure,
  onSubmit,
  onCancel,
  formId,
  className,
}: Props) {
  const hasInlineButtons = formId === undefined;
  const { control, handleSubmit } = useFormCompat<ManageFormValues>({
    defaultValues,
    resolver: yupResolver(manageFormSchema),
  });
  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <form
      id={formId}
      onSubmit={(event) => void submit(event)}
      noValidate
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex flex-col gap-3 @md:flex-row @md:items-start">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined} className="flex-1">
              <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
              <Input {...field} id={`${idPrefix}-name`} aria-invalid={fieldState.invalid || undefined} />
              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />
        {hasNotes ? (
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined} className="flex-1">
                <FieldLabel htmlFor={`${idPrefix}-notes`}>Notes (optional)</FieldLabel>
                <Input
                  {...field}
                  value={value ?? ''}
                  id={`${idPrefix}-notes`}
                  aria-invalid={fieldState.invalid || undefined}
                />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
        ) : null}
        {hasInlineButtons ? (
          <div className="flex gap-1 @md:pt-6">
            <IconButton
              type="submit"
              aria-label={submitLabel}
              disabled={isSubmitting}
              disabledReason={DISABLED_REASONS.SAVING}
            >
              {isSubmitting ? <Spinner /> : <Check aria-hidden="true" />}
            </IconButton>
            {onCancel ? (
              <IconButton
                variant="outline"
                aria-label="Cancel"
                onClick={onCancel}
                disabled={isSubmitting}
                disabledReason={DISABLED_REASONS.SAVING}
              >
                <X aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </div>
      {failure ? (
        <InlineAlert tone="error">{failure.message ?? 'Something went wrong. Please try again.'}</InlineAlert>
      ) : null}
    </form>
  );
}

export default ManageForm;
