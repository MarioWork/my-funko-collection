import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, ScanBarcode } from 'lucide-react';
import type { CategoryApiModel } from '@app-types/models';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { getQuickAddValues, quickAddSchema, type QuickAddValues } from '../addUtils';
import QuickAddFields from './QuickAddFields';

type Props = {
  barcode: string;
  categories: CategoryApiModel[];
  lastCategoryId: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: QuickAddValues) => void;
  onMoreDetails: (values: QuickAddValues) => void;
  onScanAgain: () => void;
};

const FORM_ID = 'quick-add';

// Not in the catalog yet: the few facts a box gives, the barcode pre-filled, a quantity stepper, one Add.
function QuickAddForm({
  barcode,
  categories,
  lastCategoryId,
  isSubmitting,
  errorMessage,
  onSubmit,
  onMoreDetails,
  onScanAgain,
}: Props) {
  const { control, handleSubmit, getValues, setValue, watch } = useFormCompat<QuickAddValues>({
    defaultValues: getQuickAddValues({ barcode, categoryId: lastCategoryId }),
    resolver: yupResolver(quickAddSchema),
  });
  const quantity = watch('quantity');

  return (
    <form
      id={FORM_ID}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">New funko</h2>
        <p className="text-sm text-muted-foreground tabular-nums">Barcode {barcode}</p>
      </div>
      <QuickAddFields
        control={control}
        categories={categories}
        quantity={quantity}
        setValue={setValue}
        idPrefix={FORM_ID}
      />
      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
      <div className="grid gap-2 @md:grid-cols-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" aria-hidden="true" />}
          Add
        </Button>
        <Button type="button" variant="outline" onClick={() => onMoreDetails(getValues())} disabled={isSubmitting}>
          More details
        </Button>
        <Button type="button" variant="ghost" onClick={onScanAgain} disabled={isSubmitting}>
          <ScanBarcode data-icon="inline-start" aria-hidden="true" />
          Keep scanning
        </Button>
      </div>
    </form>
  );
}

export default QuickAddForm;
