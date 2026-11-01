import { Library } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import CreateNamedButton from '@components/CreateNamedButton';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { referenceOptionLabel, type FunkoFormValues } from '../funkoFormUtils';

type Props = {
  control: Control<FunkoFormValues>;
  id: string;
};

// The options this field needs; the add and the edit loaders both return them under this name.
type SeriesOptions = {
  series: SeriesApiModel[];
};

// Required, like the category: the series the funko belongs to, and a "+" to create a missing one on the spot.
function FunkoSeriesField({ control, id }: Props) {
  const { series } = useLoaderData<SeriesOptions>();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name="seriesId"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>Series</FieldLabel>
          <div className="flex gap-2">
            <NativeSelect
              {...field}
              id={id}
              className="flex-1"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? `${descriptionId} ${errorId}` : descriptionId}
            >
              <NativeSelectOption value="">Pick a series…</NativeSelectOption>
              {series.map((entry) => (
                <NativeSelectOption key={entry.id} value={String(entry.id)}>
                  {referenceOptionLabel(entry)}
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
          <FieldDescription id={descriptionId}>
            The show, film or game it comes from, like &ldquo;Daredevil: Born Again&rdquo;.
          </FieldDescription>
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </Field>
      )}
    />
  );
}

export default FunkoSeriesField;
