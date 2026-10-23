import { Controller, type Control } from 'react-hook-form';
import type { NamedApiModel } from '@app-types/models';
import { ITEM_CONDITION_LABELS, ItemConditionUtil } from '@app-types/utility';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import TagPicker from '@components/TagPicker';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { Textarea } from '@components/ui/textarea';
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
              />
              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="condition"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={id('condition')}>Condition</FieldLabel>
              <NativeSelect {...field} id={id('condition')}>
                <NativeSelectOption value="">Not set</NativeSelectOption>
                {Object.values(ItemConditionUtil).map((condition) => (
                  <NativeSelectOption key={condition} value={condition}>
                    {ITEM_CONDITION_LABELS[condition]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}
        />
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
              />
              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
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
      <Controller
        control={control}
        name="tagIds"
        render={({ field: { value, onChange } }) => (
          <Field>
            <FieldLabel htmlFor={id('tags')}>Tags</FieldLabel>
            <TagPicker
              createActionPath={TAG_ROUTES_PATHS.BASE}
              id={id('tags')}
              tags={tags}
              value={tags.filter((tag) => value.includes(tag.id))}
              onChange={(next) => onChange(next.map((tag) => tag.id))}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id('notes')}>Notes</FieldLabel>
            <Textarea {...field} id={id('notes')} rows={3} aria-invalid={fieldState.invalid || undefined} />
            <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}

export default ItemFormFields;
