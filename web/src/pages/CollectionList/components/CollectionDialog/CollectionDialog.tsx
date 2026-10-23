import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { useFormCompat } from '@hooks/useFormCompat';
import { createFormData } from '@utils/formDataUtils';
import { collectionFormSchema, getInitialCollectionValues, toCollectionPayload } from './collectionFormUtils';
import type { loader } from './collectionDialogLoader';
import SubmitButton from '@components/SubmitButton';
import CancelButton from '@components/CancelButton';
import FormPanel from '@components/FormPanel';
import DisabledReason from '@components/DisabledReason';
import { reasonWhen } from '@utils/disabledReasonUtils';

const FORM_ID = 'collection-form';
const DEFAULT_SWITCH_REASON = 'This is the default. Make another collection the default to change it.';
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

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const onSubmit = handleSubmit((values) => {
    void fetcher.submit(createFormData({ collection: toCollectionPayload(values) }), {
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
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={`${FORM_ID}-name`}>Name</FieldLabel>
                <Input {...field} id={`${FORM_ID}-name`} aria-invalid={fieldState.invalid || undefined} />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="notes"
            render={({ field: { value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={`${FORM_ID}-notes`}>Notes (optional)</FieldLabel>
                <Textarea {...field} value={value ?? ''} id={`${FORM_ID}-notes`} rows={2} />
                <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="isDefault"
            render={({ field: { value, onChange, ...field } }) => (
              <Field orientation="horizontal">
                <DisabledReason
                  reason={reasonWhen(collection?.isDefault === true, DEFAULT_SWITCH_REASON)}
                  mode="wrapper"
                >
                  <Switch
                    {...field}
                    id={`${FORM_ID}-default`}
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={collection?.isDefault}
                  />
                </DisabledReason>
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor={`${FORM_ID}-default`}>Default collection</FieldLabel>
                  <FieldDescription>Used when Add has no collection picked.</FieldDescription>
                </div>
              </Field>
            )}
          />
        </FieldGroup>
        {failure ? (
          <InlineAlert tone="error" className="mt-4">
            {failure.message ?? 'Something went wrong. Please try again.'}
          </InlineAlert>
        ) : null}
      </form>
    </FormPanel>
  );
}

export default CollectionDialog;
