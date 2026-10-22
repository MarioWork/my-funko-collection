import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Spinner } from '@components/ui/spinner';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { useFormCompat } from '@hooks/useFormCompat';
import { createFormData } from '@utils/formDataUtils';
import { collectionFormSchema, getInitialCollectionValues, toCollectionPayload } from './collectionFormUtils';
import type { loader } from './collectionDialogLoader';

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
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${collection.name}` : 'New collection'}</DialogTitle>
          <DialogDescription>A list of funkos: owned, wanted, for sale, a shelf…</DialogDescription>
        </DialogHeader>
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
                  <Switch
                    {...field}
                    id={`${FORM_ID}-default`}
                    checked={value}
                    onCheckedChange={onChange}
                    disabled={collection?.isDefault}
                  />
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel htmlFor={`${FORM_ID}-default`}>Default collection</FieldLabel>
                    <FieldDescription>
                      Where &ldquo;Add&rdquo; puts things when you do not pick a list.
                    </FieldDescription>
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionDialog;
