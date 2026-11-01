import { Book, Library } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import type { CategoryApiModel, SeriesApiModel } from '@app-types/models';
import { CATEGORY_ROUTES_PATHS, SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import { FUNKO_TYPE_LABELS, FunkoTypeUtil } from '@app-types/utility';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { Switch } from '@components/ui/switch';
import FunkoBarcodeField from './components/FunkoBarcodeField';
import FunkoReferenceField from './components/FunkoReferenceField';
import FunkoTextField from './components/FunkoTextField';
import type { FunkoFormValues } from './funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  categories: CategoryApiModel[];
  idPrefix: string;
  barcodeAddon?: React.ReactNode;
};

// The series this form offers; the add and the edit loaders both return them under this name.
type SeriesOptions = {
  series: SeriesApiModel[];
};

// The fields of a funko, for the add flow and the edit sheet. Controller + Field: errors are linked to inputs.
function FunkoFormFields({ control, categories, idPrefix, barcodeAddon }: Props) {
  const { series } = useLoaderData<SeriesOptions>();
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <FieldGroup>
      <FunkoTextField control={control} name="name" id={id('name')} label="Name" />
      <div className="grid grid-cols-2 gap-4">
        <FunkoTextField
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
      <FunkoReferenceField
        control={control}
        name="categoryId"
        id={id('category')}
        label="Category"
        placeholder="Pick a line…"
        description={<>The line printed on the box, like &ldquo;Pop! Marvel&rdquo;.</>}
        rows={categories}
        noun="category"
        icon={Book}
        createPath={CATEGORY_ROUTES_PATHS.BASE}
      />
      <FunkoReferenceField
        control={control}
        name="seriesId"
        id={id('series')}
        label="Series"
        placeholder="Pick a series…"
        description={<>The show, film or game it comes from, like &ldquo;Daredevil: Born Again&rdquo;.</>}
        rows={series}
        noun="series"
        icon={Library}
        createPath={SERIES_ROUTES_PATHS.BASE}
      />
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
      <FunkoTextField
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
