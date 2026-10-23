import { Controller, type Control } from 'react-hook-form';
import type { NamedApiModel } from '@app-types/models';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import ItemConditionField from './components/ItemConditionField';
import ItemTagsField from './components/ItemTagsField';
import type { ItemFormValues } from './itemFormUtils';

type Props = {
  control: Control<ItemFormValues>;
  tags: NamedApiModel[];
  idPrefix: string;
};

// Quantity, condition, price, date, notes, tags: what you know about your copy, not about the figure.
function ItemFormFields({ control, tags, idPrefix }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="quantity"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={id('quantity')}>Quantity</FieldLabel>
              <Input
                {...field}
                id={id('quantity')}
                type="number"
                inputMode="numeric"
                min={1}
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.error ? `${id('quantity')}-error` : undefined}
              />
              <FieldError id={`${id('quantity')}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />
        <ItemConditionField control={control} id={id('condition')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="price"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={id('price')}>Paid (EUR)</FieldLabel>
              <Input
                {...field}
                id={id('price')}
                inputMode="decimal"
                placeholder="14.99"
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.error ? `${id('price')}-error` : undefined}
              />
              <FieldError id={`${id('price')}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="purchasedAt"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={id('date')}>Bought on</FieldLabel>
              <Input {...field} id={id('date')} type="date" />
            </Field>
          )}
        />
      </div>
      <ItemTagsField control={control} tags={tags} id={id('tags')} />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id('notes')}>Notes</FieldLabel>
            <Textarea
              {...field}
              id={id('notes')}
              rows={3}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${id('notes')}-error` : undefined}
            />
            <FieldError id={`${id('notes')}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}

export default ItemFormFields;
