import { Controller, type Control } from 'react-hook-form';
import DisabledReason from '@components/DisabledReason';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { Switch } from '@components/ui/switch';
import { reasonWhen } from '@utils/disabledReasonUtils';
import type { CollectionFormValues } from '../collectionFormUtils';

type Props = {
  control: Control<CollectionFormValues>;
  idPrefix: string;
  // The current default cannot be switched off here: another collection has to become the default.
  isCurrentDefault: boolean;
};

const DEFAULT_SWITCH_REASON = 'This is the default. Make another collection the default to change it.';

function CollectionDefaultField({ control, idPrefix, isCurrentDefault }: Props) {
  const id = `${idPrefix}-default`;

  return (
    <Controller
      control={control}
      name="isDefault"
      render={({ field: { value, onChange, ...field } }) => (
        <Field orientation="horizontal">
          <DisabledReason reason={reasonWhen(isCurrentDefault, DEFAULT_SWITCH_REASON)} mode="wrapper">
            <Switch {...field} id={id} checked={value} onCheckedChange={onChange} disabled={isCurrentDefault} />
          </DisabledReason>
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor={id}>Default collection</FieldLabel>
            <FieldDescription>Used when Add has no collection picked.</FieldDescription>
          </div>
        </Field>
      )}
    />
  );
}

export default CollectionDefaultField;
