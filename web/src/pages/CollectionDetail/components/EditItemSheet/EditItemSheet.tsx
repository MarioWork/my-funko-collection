import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import ItemFormFields from '@components/ItemFormFields';
import {
  itemFormSchema,
  itemToFormValues,
  toItemPayload,
  type ItemFormValues,
} from '@components/ItemFormFields/itemFormUtils';
import { useFormCompat } from '@hooks/useFormCompat';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import type { loader } from './editItemSheetLoader';
import SubmitButton from '@components/SubmitButton';
import CancelButton from '@components/CancelButton';
import FormPanel from '@components/FormPanel';

const FORM_ID = 'edit-item';
const BACK = -1;

// Routed under /collections/:id/items/:itemId/edit. Owns its loader and action; closing goes back.
function EditItemSheet() {
  const { item, tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<CollectionItemApiModel>>();
  const navigate = useNavigate();
  const { control, handleSubmit } = useFormCompat<ItemFormValues>({
    defaultValues: itemToFormValues(item),
    resolver: yupResolver(itemFormSchema),
  });
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const onSubmit = handleSubmit((values) => {
    const payload = toItemPayload(values);

    // Nothing to save: just close.
    if (isSamePayload(toItemPayload(itemToFormValues(item)), payload)) {
      close();

      return;
    }

    void fetcher.submit(createFormData({ item: payload }), { method: HttpVerbsUtil.PATCH });
  });

  return (
    <FormPanel
      title={`${item.funko.name} in ${item.collection.name}`}
      description="Your copy: how many, in what state, what you paid, where it is."
      onClose={close}
      isWide
      footer={
        <>
          <CancelButton isSubmitting={isSubmitting} onCancel={close} />
          <SubmitButton isSubmitting={isSubmitting} form={FORM_ID}>
            Save changes
          </SubmitButton>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate>
        <ItemFormFields control={control} tags={tags} idPrefix={FORM_ID} />
        {failure ? (
          <InlineAlert tone="error" className="mt-4">
            {failure.message ?? 'Something went wrong. Please try again.'}
          </InlineAlert>
        ) : null}
      </form>
    </FormPanel>
  );
}

export default EditItemSheet;
