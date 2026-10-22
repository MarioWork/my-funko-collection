import { yupResolver } from '@hookform/resolvers/yup';
import { Plus } from 'lucide-react';
import type { CategoryApiModel } from '@app-types/models';
import FunkoFormFields from '@components/FunkoFormFields';
import {
  funkoFormSchema,
  getInitialFunkoValues,
  type FunkoFormValues,
} from '@components/FunkoFormFields/funkoFormUtils';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';

type Props = {
  categories: CategoryApiModel[];
  initialValues?: Partial<FunkoFormValues>;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: FunkoFormValues) => void;
  barcodeAddon?: React.ReactNode;
};

const FORM_ID = 'add-details';

// The full form: every catalog field. One column even on a wide screen, sticky Save on phones.
function AddDetailsForm({ categories, initialValues, isSubmitting, errorMessage, onSubmit, barcodeAddon }: Props) {
  const { control, handleSubmit } = useFormCompat<FunkoFormValues>({
    defaultValues: getInitialFunkoValues(initialValues),
    resolver: yupResolver(funkoFormSchema),
  });

  return (
    <form
      id={FORM_ID}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <FunkoFormFields control={control} categories={categories} idPrefix={FORM_ID} barcodeAddon={barcodeAddon} />
      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
      <div className="sticky bottom-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] -mx-4 -mb-4 border-t bg-card p-4 lg:static lg:m-0 lg:border-0 lg:p-0">
        <Button type="submit" className="w-full lg:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" aria-hidden="true" />}
          Add funko
        </Button>
      </div>
    </form>
  );
}

export default AddDetailsForm;
