import { yupResolver } from '@hookform/resolvers/yup';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import { FieldGroup } from '@components/ui/field';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { useFormCompat } from '@hooks/useFormCompat';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import { collectionFormSchema, getInitialCollectionValues, toCollectionPayload } from './collectionFormUtils';
import type { loader } from './collectionDialogLoader';
import SubmitButton from '@components/SubmitButton';
import CancelButton from '@components/CancelButton';
import FormPanel from '@components/FormPanel';
import CollectionDefaultField from './components/CollectionDefaultField';
import CollectionNameField from './components/CollectionNameField';
import CollectionNotesField from './components/CollectionNotesField';

const FORM_ID = 'collection-form';
const BACK = -1;

// Routed under /collections/add and /collections/:id/edit; closing goes back to the list.
function CollectionDialog() {
  const { collection } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<CollectionApiModel>>();
  const navigate = useNavigate();
  const { control, handleSubmit } = useFormCompat({
    defaultValues: getInitialCollectionValues(collection),
    resolver: yupResolver(collectionFormSchema),
  });
  const isEdit = collection !== null;
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  useCloseOnSuccess(fetcher, close);

  const onSubmit = handleSubmit((values) => {
    const payload = toCollectionPayload(values);
    const isUnchanged = isEdit && isSamePayload(toCollectionPayload(getInitialCollectionValues(collection)), payload);

    // Editing and nothing to save: just close.
    if (isUnchanged) {
      close();

      return;
    }

    void fetcher.submit(createFormData({ collection: payload }), {
      method: isEdit ? HttpVerbsUtil.PATCH : HttpVerbsUtil.POST,
    });
  });

  return (
    <FormPanel
      title={isEdit ? `Edit ${collection.name}` : 'New collection'}
      description="A list of funkos: owned, wanted, for sale, a shelf…"
      onClose={close}
      footer={
        <>
          <CancelButton isSubmitting={isSubmitting} onCancel={close} />
          <SubmitButton isSubmitting={isSubmitting} form={FORM_ID}>
            {isEdit ? 'Save' : 'Create'}
          </SubmitButton>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate>
        <FieldGroup>
          <CollectionNameField control={control} idPrefix={FORM_ID} />
          <CollectionNotesField control={control} idPrefix={FORM_ID} />
          <CollectionDefaultField
            control={control}
            idPrefix={FORM_ID}
            isCurrentDefault={collection?.isDefault === true}
          />
        </FieldGroup>
        {failure ? (
          <InlineAlert tone="error" className="mt-4">
            {failure.message ?? GENERIC_WRITE_ERROR}
          </InlineAlert>
        ) : null}
      </form>
    </FormPanel>
  );
}

export default CollectionDialog;
