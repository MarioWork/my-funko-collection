import { Library } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import CreateNamedButton from '@components/CreateNamedButton';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import type { FunkoFormValues } from '../funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  id: string;
};

// The options this field needs; the add and the edit loaders both return them under this name.
type SeriesOptions = {
  series: SeriesApiModel[];
};

const NO_SERIES = '';

// Optional: the series the funko belongs to, and a "+" to create a missing one on the spot.
function FunkoSeriesField({ control, id }: Props) {
  const { series } = useLoaderData<SeriesOptions>();

  return (
    <Controller
      control={control}
      name="seriesId"
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={id}>Series (optional)</FieldLabel>
          <div className="flex gap-2">
            <NativeSelect {...field} id={id} className="flex-1" aria-describedby={`${id}-description`}>
              <NativeSelectOption value={NO_SERIES}>None</NativeSelectOption>
              {series.map((entry) => (
                <NativeSelectOption key={entry.id} value={String(entry.id)}>
                  {entry.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <CreateNamedButton
              icon={Library}
              noun="series"
              actionPath={SERIES_ROUTES_PATHS.BASE}
              onCreated={(created) => field.onChange(String(created.id))}
            />
          </div>
          <FieldDescription id={`${id}-description`}>
            The series it belongs to, like &ldquo;Daredevil: Born Again&rdquo;.
          </FieldDescription>
        </Field>
      )}
    />
  );
}

export default FunkoSeriesField;
