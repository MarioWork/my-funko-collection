import { Controller, type Control } from 'react-hook-form';
import { ITEM_CONDITION_LABELS, ItemConditionUtil } from '@app-types/utility';
import { Field, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { ItemFormValues } from '../itemFormUtils';

type Props = {
  control: Control<ItemFormValues>;
  id: string;
};

function ItemConditionField({ control, id }: Props) {
  return (
    <Controller
      control={control}
      name="condition"
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={id}>Condition</FieldLabel>
          <NativeSelect {...field} id={id}>
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
  );
}

export default ItemConditionField;
