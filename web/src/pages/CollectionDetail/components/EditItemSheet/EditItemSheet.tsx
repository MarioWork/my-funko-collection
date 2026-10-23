import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import ItemFormFields, {
  itemFormSchema,
  itemToFormValues,
  toItemPayload,
  type ItemFormValues,
} from '@components/ItemFormFields';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { useFormCompat } from '@hooks/useFormCompat';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import type { loader } from './editItemSheetLoader';
import SubmitButton from '@components/SubmitButton';
import CancelButton from '@components/CancelButton';
import FormPanel from '@components/FormPanel';

const FORM_ID = 'edit-item';
const BACK = -1;

// Routed under /collections/:id/items/:itemId/edit, and over a funko's page at
// /funkos/:funkoId/collections/:id/items/:itemId/edit. Owns its loader and action; closing goes back.
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

  useCloseOnSuccess(fetcher, close);

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
            {failure.message ?? GENERIC_WRITE_ERROR}
          </InlineAlert>
        ) : null}
      </form>
    </FormPanel>
  );
}

export default EditItemSheet;
