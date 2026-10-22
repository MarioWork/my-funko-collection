import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionItemApiModel, FunkoSummaryApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import FunkoPicker from '@components/FunkoPicker';
import InlineAlert from '@components/InlineAlert';
import ItemFormFields from '@components/ItemFormFields';
import {
  getInitialItemValues,
  itemFormSchema,
  toCreateItemPayload,
  type ItemFormValues,
} from '@components/ItemFormFields/itemFormUtils';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@components/ui/field';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { createFormData } from '@utils/formDataUtils';
import type { loader } from './addItemDialogLoader';

const FORM_ID = 'add-item';
const BACK = -1;

// Pick a funko from the catalog, then the copy's details. Routed under /collections/:id/items/add.
function AddItemDialog() {
  const { tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<CollectionItemApiModel>>();
  const navigate = useNavigate();
  const [funko, setFunko] = useState<FunkoSummaryApiModel | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const { control, handleSubmit } = useFormCompat<ItemFormValues>({
    defaultValues: getInitialItemValues(),
    resolver: yupResolver(itemFormSchema),
  });
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;
  const isMissingFunko = hasTriedSubmit && funko === null;

  const close = () => void navigate(BACK);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const onSubmit = handleSubmit((values) => {
    setHasTriedSubmit(true);

    if (!funko) return;

    void fetcher.submit(createFormData({ item: toCreateItemPayload(funko.id, values) }), {
      method: HttpVerbsUtil.POST,
    });
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to this collection</DialogTitle>
          <DialogDescription>Pick a funko from your catalog and say what you know about your copy.</DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-5">
          <Field data-invalid={isMissingFunko || undefined}>
            <FieldLabel htmlFor={`${FORM_ID}-funko`}>Funko</FieldLabel>
            <FunkoPicker id={`${FORM_ID}-funko`} value={funko} onChange={setFunko} />
            {isMissingFunko ? <FieldError>Pick a funko first.</FieldError> : null}
          </Field>
          <ItemFormFields control={control} tags={tags} idPrefix={FORM_ID} />
          {failure ? (
            <InlineAlert tone="error">{failure.message ?? 'Something went wrong. Please try again.'}</InlineAlert>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddItemDialog;
