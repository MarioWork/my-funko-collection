import { Controller, type Control } from 'react-hook-form';
import type { CategoryApiModel } from '@app-types/models';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { FunkoFormValues } from '../funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  categories: CategoryApiModel[];
  id: string;
};

function FunkoCategoryField({ control, categories, id }: Props) {
  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Category</FieldLabel>
          <NativeSelect
            {...field}
            id={id}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          >
            <NativeSelectOption value="">Pick a line…</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={String(category.id)}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>The line printed on the box, like &ldquo;Pop! Marvel&rdquo;.</FieldDescription>
          <FieldError id={`${id}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoCategoryField;
