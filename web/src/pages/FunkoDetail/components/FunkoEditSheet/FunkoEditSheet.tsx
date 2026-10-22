import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import FunkoFormFields from '@components/FunkoFormFields';
import { funkoFormSchema, funkoToFormValues, toFunkoPayload } from '@components/FunkoFormFields/funkoFormUtils';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@components/ui/sheet';
import { Spinner } from '@components/ui/spinner';
import { useFormCompat } from '@hooks/useFormCompat';
import { useIsDesktop } from '@hooks/useMediaQuery';
import { createFormData } from '@utils/formDataUtils';
import type { loader } from './funkoEditSheetLoader';

const FORM_ID = 'edit-funko';
const BACK = -1;

// Routed under /funkos/:funkoId/edit: owns its loader (funko + categories) and its action. Closing goes back.
function FunkoEditSheet() {
  const { funko, categories } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<FunkoApiModel>>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { control, handleSubmit } = useFormCompat({
    defaultValues: funkoToFormValues(funko),
    resolver: yupResolver(funkoFormSchema),
  });
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const onSubmit = handleSubmit((values) => {
    void fetcher.submit(createFormData({ funko: toFunkoPayload(values) }), { method: HttpVerbsUtil.PATCH });
  });

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className="flex max-h-dvh flex-col gap-0 overflow-hidden sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Edit {funko.name}</SheetTitle>
          <SheetDescription>
            Catalog facts only; quantity, price and tags live on each collection item.
          </SheetDescription>
        </SheetHeader>
        <form
          id={FORM_ID}
          onSubmit={(event) => void onSubmit(event)}
          noValidate
          className="flex-1 overflow-y-auto px-4 pb-4"
        >
          <FunkoFormFields control={control} categories={categories} idPrefix={FORM_ID} />
          {failure ? (
            <InlineAlert tone="error" className="mt-4">
              {failure.message ?? 'Something went wrong. Please try again.'}
            </InlineAlert>
          ) : null}
        </form>
        <SheetFooter className="border-t pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            Save changes
          </Button>
          <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default FunkoEditSheet;
