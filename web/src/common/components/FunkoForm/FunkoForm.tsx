import { yupResolver } from '@hookform/resolvers/yup';
import { Save } from 'lucide-react';
import { useState } from 'react';
import type { CategoryApiModel, CollectionId, FunkoDetailApiModel, NamedApiModel } from '@app-types/models';
import FunkoFormFields from '@components/FunkoFormFields';
import {
  funkoFormSchema,
  getInitialFunkoValues,
  toFunkoPayload,
  type FunkoFormValues,
} from '@components/FunkoFormFields/funkoFormUtils';
import InlineAlert from '@components/InlineAlert';
import SubmitButton from '@components/SubmitButton';
import { FieldSeparator } from '@components/ui/field';
import { useFormCompat } from '@hooks/useFormCompat';
import FunkoDestinationFields from './components/FunkoDestinationFields';
import FunkoPhotoFields from './components/FunkoPhotoFields';
import type { FunkoFormSubmission } from './funkoFormSubmission.type';
import { usePendingPhotos } from './hooks/usePendingPhotos';

type Props = {
  // Set when editing: its photos are managed in place and only its collections are offered (no tags).
  funko?: FunkoDetailApiModel;
  categories: CategoryApiModel[];
  initialValues: Partial<FunkoFormValues>;
  initialCollectionIds: CollectionId[];
  initialTags: NamedApiModel[];
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (submission: FunkoFormSubmission) => void;
};

// Everything about a funko in one place: its details, its photos, and the collections it is in. Adding: one Save
// creates it, uploads the photos and files it. Editing: the same form, filled in. The page or dialog around it
// supplies the card; the Save button sticks to the bottom on phones.
function FunkoForm({
  funko,
  categories,
  initialValues,
  initialCollectionIds,
  initialTags,
  isSubmitting,
  errorMessage,
  onSubmit,
}: Props) {
  const isEdit = funko !== undefined;
  const formId = isEdit ? 'edit-funko' : 'add-funko';
  const { control, handleSubmit } = useFormCompat<FunkoFormValues>({
    defaultValues: getInitialFunkoValues(initialValues),
    resolver: yupResolver(funkoFormSchema),
  });
  const pendingPhotos = usePendingPhotos();
  const [collectionIds, setCollectionIds] = useState<CollectionId[]>(initialCollectionIds);
  const [selectedTags, setSelectedTags] = useState<NamedApiModel[]>(initialTags);
  // Shown once Save was pressed, and gone as soon as a photo is picked.
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const isMissingPhotos = !isEdit && hasTriedSubmit && pendingPhotos.photos.length === 0;

  const submit = (values: FunkoFormValues) => {
    if (!isEdit && pendingPhotos.photos.length === 0) return;

    // Tags belong to items, so "just the catalog" carries none.
    const tagIds = collectionIds.length > 0 ? selectedTags.map((tag) => tag.id) : [];

    onSubmit({
      funko: toFunkoPayload(values),
      destination: { collectionIds, tagIds },
      photos: pendingPhotos.photos,
    });
  };

  return (
    <form
      id={formId}
      onSubmit={(event) => {
        setHasTriedSubmit(true);
        void handleSubmit(submit)(event);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <FunkoFormFields control={control} categories={categories} idPrefix={formId} />
      <FieldSeparator />
      <FunkoPhotoFields
        funko={funko}
        formId={formId}
        pendingPhotos={pendingPhotos}
        isSubmitting={isSubmitting}
        isMissingPhotos={isMissingPhotos}
      />
      <FieldSeparator />
      <FunkoDestinationFields
        idPrefix={formId}
        hasTags={!isEdit}
        initialCollectionIds={initialCollectionIds}
        collectionIds={collectionIds}
        selectedTags={selectedTags}
        onCollectionsChange={setCollectionIds}
        onTagsChange={setSelectedTags}
      />
      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
      <div className="sticky bottom-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] -mx-4 -mb-4 border-t bg-card p-4 lg:static lg:m-0 lg:border-0 lg:p-0">
        <SubmitButton
          isSubmitting={isSubmitting}
          className="w-full lg:w-auto"
          icon={<Save data-icon="inline-start" aria-hidden="true" />}
        >
          {isEdit ? 'Save changes' : 'Save funko'}
        </SubmitButton>
      </div>
    </form>
  );
}

export default FunkoForm;
