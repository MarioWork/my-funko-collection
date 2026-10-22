import { yupResolver } from '@hookform/resolvers/yup';
import { Controller } from 'react-hook-form';
import type { ApiError } from '@app-types/models';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { cn } from '@utils/classNameUtils';
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
  className?: string;
};

// One row of fields (name, optional notes) and the buttons; used both to add and to rename inline.
function ManageForm({
  idPrefix,
  defaultValues,
  hasNotes,
  submitLabel,
  isSubmitting,
  failure,
  onSubmit,
  onCancel,
  className,
}: Props) {
  const { control, handleSubmit } = useFormCompat<ManageFormValues>({
    defaultValues,
    resolver: yupResolver(manageFormSchema),
  });
  const submit = handleSubmit((values) => onSubmit(values));

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className={cn('flex flex-col gap-3', className)}>
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
        <div className="flex gap-2 @md:pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            {submitLabel}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
      {failure ? (
        <InlineAlert tone="error">{failure.message ?? 'Something went wrong. Please try again.'}</InlineAlert>
      ) : null}
    </form>
  );
}

export default ManageForm;
