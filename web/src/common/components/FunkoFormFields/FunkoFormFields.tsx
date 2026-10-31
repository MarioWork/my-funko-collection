import { Controller, type Control } from 'react-hook-form';
import type { CategoryApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS, FunkoTypeUtil } from '@app-types/utility';
import { Field, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { Switch } from '@components/ui/switch';
import FunkoBarcodeField from './components/FunkoBarcodeField';
import FunkoCategoryField from './components/FunkoCategoryField';
import FunkoSeriesField from './components/FunkoSeriesField';
import type { FunkoFormValues } from './funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  categories: CategoryApiModel[];
  idPrefix: string;
  barcodeAddon?: React.ReactNode;
};

type TextFieldName = 'name' | 'number' | 'exclusive';

type TextFieldInputMode = 'numeric' | 'text';

type TextFieldProps = {
  control: Control<FunkoFormValues>;
  name: TextFieldName;
  id: string;
  label: string;
  placeholder?: string;
  inputMode?: TextFieldInputMode;
};

function TextField({ control, name, id, label, placeholder, inputMode }: TextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            inputMode={inputMode}
            placeholder={placeholder}
            autoComplete="off"
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          />
          <FieldError id={`${id}-error`} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

// The fields of a funko, for the add flow and the edit sheet. Controller + Field: errors are linked to inputs.
function FunkoFormFields({ control, categories, idPrefix, barcodeAddon }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <FieldGroup>
      <TextField control={control} name="name" id={id('name')} label="Name" />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          control={control}
          name="number"
          id={id('number')}
          label="Number"
          placeholder="1300"
          inputMode="numeric"
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
      <FunkoCategoryField control={control} categories={categories} id={id('category')} />
      <FunkoSeriesField control={control} id={id('series')} />
      <Controller
        control={control}
        name="isChase"
        render={({ field: { value, onChange, ...field } }) => (
          <Field orientation="horizontal">
            <Switch {...field} id={id('chase')} checked={value} onCheckedChange={onChange} />
            <FieldLabel htmlFor={id('chase')}>Chase variant</FieldLabel>
          </Field>
        )}
      />
      <TextField
        control={control}
        name="exclusive"
        id={id('exclusive')}
        label="Exclusive (optional)"
        placeholder="SDCC 2024, Hot Topic…"
      />
      <FunkoBarcodeField control={control} id={id('barcode')} addon={barcodeAddon} />
    </FieldGroup>
  );
}

export default FunkoFormFields;
