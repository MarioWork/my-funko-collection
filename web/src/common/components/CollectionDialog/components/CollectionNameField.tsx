import { Controller, type Control } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { CollectionFormValues } from '../collectionFormUtils';

type Props = {
  control: Control<CollectionFormValues>;
  idPrefix: string;
};

function CollectionNameField({ control, idPrefix }: Props) {
  const id = `${idPrefix}-name`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Name</FieldLabel>
          <Input
            {...field}
            id={id}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? errorId : undefined}
          />
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default CollectionNameField;
