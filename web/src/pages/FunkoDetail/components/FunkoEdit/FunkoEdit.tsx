import { useEffect } from 'react';
import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import FormPanel from '@components/FormPanel';
import FunkoForm from '@components/FunkoForm';
import type { FunkoFormSubmission } from '@components/FunkoForm/funkoFormSubmission.type';
import { funkoToFormValues, toFunkoPayload } from '@components/FunkoFormFields/funkoFormUtils';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import type { loader } from './funkoEditLoader';

const BACK = -1;

// Routed under /funkos/:funkoId/edit: the Add form, filled in. A dialog on desktop, a page on phones. Photos change
// right away inside it; Save writes the details and the collections, then goes back to the funko.
function FunkoEdit() {
  const { funko, categories, items } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<FunkoApiModel>>();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const savedCollectionIds = items.map((item) => item.collection.id);

  const submit = ({ funko: details, destination }: FunkoFormSubmission) => {
    const isDetailsUnchanged = isSamePayload(toFunkoPayload(funkoToFormValues(funko)), details);
    const isCollectionsUnchanged = isSamePayload([...savedCollectionIds].sort(), [...destination.collectionIds].sort());

    // Nothing to save: just close.
    if (isDetailsUnchanged && isCollectionsUnchanged) {
      close();

      return;
    }

    void fetcher.submit(createFormData({ funko: details, collectionIds: destination.collectionIds }), {
      method: HttpVerbsUtil.PATCH,
    });
  };

  return (
    <FormPanel
      title={`Edit ${funko.name}`}
      description="Details, collections and images. Quantity, price and tags are on each collection's item."
      onClose={close}
      isWide
    >
      <FunkoForm
        funko={funko}
        categories={categories}
        initialValues={funkoToFormValues(funko)}
        initialCollectionIds={savedCollectionIds}
        initialTags={[]}
        isSubmitting={isSubmitting}
        errorMessage={failure ? (failure.message ?? 'Something went wrong. Please try again.') : undefined}
        onSubmit={submit}
      />
    </FormPanel>
  );
}

export default FunkoEdit;
