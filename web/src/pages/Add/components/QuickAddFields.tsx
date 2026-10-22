import { Minus, Plus } from 'lucide-react';
import { Controller, type Control, type UseFormSetValue } from 'react-hook-form';
import type { CategoryApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS, FunkoTypeUtil } from '@app-types/utility';
import IconButton from '@components/IconButton';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { QuickAddValues } from '../addUtils';

type Props = {
  control: Control<QuickAddValues>;
  categories: CategoryApiModel[];
  quantity: number;
  setValue: UseFormSetValue<QuickAddValues>;
  idPrefix: string;
};

const MIN_QUANTITY = 1;

function QuickAddFields({ control, categories, quantity, setValue, idPrefix }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id('name')}>Name</FieldLabel>
            <Input {...field} id={id('name')} autoComplete="off" aria-invalid={fieldState.invalid || undefined} />
            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="number"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={id('number')}>Number</FieldLabel>
              <Input {...field} id={id('number')} inputMode="numeric" aria-invalid={fieldState.invalid || undefined} />
              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={id('type')}>Type</FieldLabel>
              <NativeSelect {...field} id={id('type')}>
                {Object.values(FunkoTypeUtil).map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {FUNKO_TYPE_LABELS[type]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}
        />
      </div>
      <Controller
        control={control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id('category')}>Category</FieldLabel>
            <NativeSelect {...field} id={id('category')} aria-invalid={fieldState.invalid || undefined}>
              <NativeSelectOption value="">Pick a line…</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={String(category.id)}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        )}
      />
      <Field orientation="horizontal" className="items-center">
        <FieldLabel>Quantity</FieldLabel>
        <div className="ml-auto flex items-center gap-2">
          <IconButton
            aria-label="One less"
            variant="outline"
            disabled={quantity <= MIN_QUANTITY}
            onClick={() => setValue('quantity', quantity - 1)}
          >
            <Minus aria-hidden="true" />
          </IconButton>
          <span className="w-6 text-center tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <IconButton aria-label="One more" variant="outline" onClick={() => setValue('quantity', quantity + 1)}>
            <Plus aria-hidden="true" />
          </IconButton>
        </div>
      </Field>
    </FieldGroup>
  );
}

export default QuickAddFields;
