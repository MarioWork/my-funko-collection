import { useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import FormPanel from '@components/FormPanel';
import { funkoToFormValues, toFunkoPayload } from '@components/FunkoFormFields';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import FunkoEditForm from './components/FunkoEditForm';
import type { FunkoEditSubmission } from './components/FunkoEditForm/types';
import type { loader } from './funkoEditLoader';

const BACK = -1;

// Routed under /funkos/:funkoId/edit: the funko's details, filled in. A dialog on desktop, a page on phones. Photos change
// right away inside it; Save writes the details and the collections, then goes back to the funko.
function FunkoEdit() {
  const { funko, categories, items } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<FunkoApiModel>>();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  useCloseOnSuccess(fetcher, close);

  const savedCollectionIds = items.map((item) => item.collection.id);

  const submit = ({ funko: details, collectionIds }: FunkoEditSubmission) => {
    const isDetailsUnchanged = isSamePayload(toFunkoPayload(funkoToFormValues(funko)), details);
    const isCollectionsUnchanged = isSamePayload([...savedCollectionIds].sort(), [...collectionIds].sort());

    // Nothing to save: just close.
    if (isDetailsUnchanged && isCollectionsUnchanged) {
      close();

      return;
    }

    void fetcher.submit(createFormData({ funko: details, collectionIds }), {
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
      <FunkoEditForm
        funko={funko}
        categories={categories}
        initialCollectionIds={savedCollectionIds}
        isSubmitting={isSubmitting}
        errorMessage={failure ? (failure.message ?? GENERIC_WRITE_ERROR) : undefined}
        existingFunkoId={failure?.existingId}
        onSubmit={submit}
      />
    </FormPanel>
  );
}

export default FunkoEdit;
