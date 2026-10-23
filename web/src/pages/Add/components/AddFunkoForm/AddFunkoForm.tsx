import { yupResolver } from '@hookform/resolvers/yup';
import { useState, type FormEvent } from 'react';
import { useLoaderData } from 'react-router';
import type { CollectionId } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import FunkoFormFields, {
  funkoFormSchema,
  getInitialFunkoValues,
  toFunkoPayload,
  type FunkoFormValues,
} from '@components/FunkoFormFields';
import { useFormCompat } from '@hooks/useFormCompat';
import type { loader } from '../../addLoader';
import AddCollectionsSection from './components/AddCollectionsSection';
import AddPhotosSection from './components/AddPhotosSection';
import AddSaveBar from './components/AddSaveBar';
import FormSection from './components/FormSection';
import { useItemForms } from './hooks/useItemForms';
import { usePendingPhotos } from './hooks/usePendingPhotos';
import type { AddFunkoSubmission } from './types';

type Props = {
  initialValues: Partial<FunkoFormValues>;
  initialCollectionIds: CollectionId[];
  initialTagIds: number[];
  isSubmitting: boolean;
  errorMessage?: string;
  // Sent with a duplicate (409): the funko that already exists, linked from the error.
  existingFunkoId?: number;
  onSubmit: (submission: AddFunkoSubmission) => void;
};

const FORM_ID = 'add-funko';
const DETAILS_SECTION_ID = 'add-details';

// A new funko on one page: its images, its details, and the collections it goes in with the details of each copy.
// One Save does it all. Two columns on a computer (the form, and a sticky summary with Save), one on a phone.
function AddFunkoForm({
  initialValues,
  initialCollectionIds,
  initialTagIds,
  isSubmitting,
  errorMessage,
  existingFunkoId,
  onSubmit,
}: Props) {
  // The pickers' options come straight from the Add page's loader.
  const { categories, collections, tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { control, handleSubmit } = useFormCompat<FunkoFormValues>({
    defaultValues: getInitialFunkoValues(initialValues),
    resolver: yupResolver(funkoFormSchema),
  });
  const pendingPhotos = usePendingPhotos();
  const itemForms = useItemForms();
  const [collectionIds, setCollectionIds] = useState<CollectionId[]>(initialCollectionIds);
  // Shown once Save was pressed, and gone as soon as a photo is picked.
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const isMissingPhotos = hasTriedSubmit && pendingPhotos.photos.length === 0;
  const collectionNames = collections
    .filter((collection) => collectionIds.includes(collection.id))
    .map((collection) => collection.name);

  // The funko's fields and every collection card are checked together, so all their errors show at once.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSubmit(true);

    const items = await itemForms.readItems(collectionIds);

    await handleSubmit((values) => {
      const hasPhotos = pendingPhotos.photos.length > 0;

      if (items === null || !hasPhotos) return;

      onSubmit({ funko: toFunkoPayload(values), items, photos: pendingPhotos.photos });
    })();
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={(event) => void submit(event)}
      noValidate
      className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6"
    >
      <div className="flex flex-col gap-4">
        <AddPhotosSection pendingPhotos={pendingPhotos} isSubmitting={isSubmitting} isMissingPhotos={isMissingPhotos} />
        <FormSection id={DETAILS_SECTION_ID} title="Details" description="As printed on the box.">
          <FunkoFormFields control={control} categories={categories} idPrefix={FORM_ID} />
        </FormSection>
        <AddCollectionsSection
          collections={collections}
          tags={tags}
          collectionIds={collectionIds}
          initialCollectionIds={initialCollectionIds}
          initialTagIds={initialTagIds}
          isSubmitting={isSubmitting}
          onCollectionsChange={setCollectionIds}
          onRegister={itemForms.register}
        />
      </div>
      <AddSaveBar
        formId={FORM_ID}
        mainPhoto={pendingPhotos.photos[0]}
        collectionNames={collectionNames}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        existingFunkoId={existingFunkoId}
      />
    </form>
  );
}

export default AddFunkoForm;
