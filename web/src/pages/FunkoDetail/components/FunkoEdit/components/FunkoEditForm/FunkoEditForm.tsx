import { yupResolver } from '@hookform/resolvers/yup';
import { Save } from 'lucide-react';
import { useState } from 'react';
import type { CategoryApiModel, CollectionId, FunkoDetailApiModel } from '@app-types/models';
import FunkoFormError from '@components/FunkoFormError';
import FunkoFormFields, {
  funkoFormSchema,
  funkoToFormValues,
  toFunkoPayload,
  type FunkoFormValues,
} from '@components/FunkoFormFields';
import FunkoPhotoManager from '@components/FunkoPhotoManager';
import SubmitButton from '@components/SubmitButton';
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@components/ui/field';
import { useFormCompat } from '@hooks/useFormCompat';
import FunkoCollectionsField from './components/FunkoCollectionsField';
import type { FunkoEditSubmission } from './types';

type Props = {
  funko: FunkoDetailApiModel;
  categories: CategoryApiModel[];
  initialCollectionIds: CollectionId[];
  isSubmitting: boolean;
  errorMessage?: string;
  // Sent with a duplicate (409): the funko that already exists, linked from the error.
  existingFunkoId?: number;
  onSubmit: (submission: FunkoEditSubmission) => void;
};

const FORM_ID = 'edit-funko';

// A funko's details, the collections it is in, and its images, which change right away (not on Save). Quantity,
// price and tags live on each collection's item and are edited there.
function FunkoEditForm({
  funko,
  categories,
  initialCollectionIds,
  isSubmitting,
  errorMessage,
  existingFunkoId,
  onSubmit,
}: Props) {
  const { control, handleSubmit } = useFormCompat<FunkoFormValues>({
    defaultValues: funkoToFormValues(funko),
    resolver: yupResolver(funkoFormSchema),
  });
  const [collectionIds, setCollectionIds] = useState<CollectionId[]>(initialCollectionIds);

  const submit = handleSubmit((values) => onSubmit({ funko: toFunkoPayload(values), collectionIds }));

  return (
    <form id={FORM_ID} onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-5">
      <FunkoFormFields control={control} categories={categories} idPrefix={FORM_ID} />
      <FieldSeparator />
      <FunkoCollectionsField
        idPrefix={FORM_ID}
        initialCollectionIds={initialCollectionIds}
        collectionIds={collectionIds}
        onChange={setCollectionIds}
      />
      <FieldSeparator />
      <FieldSet className="gap-3">
        <FieldLegend variant="label">Images</FieldLegend>
        <FieldDescription>Changes to images apply right away.</FieldDescription>
        <FunkoPhotoManager funko={funko} />
      </FieldSet>
      {errorMessage ? <FunkoFormError message={errorMessage} existingFunkoId={existingFunkoId} /> : null}
      <div className="sticky bottom-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] -mx-4 -mb-4 border-t bg-card p-4 lg:static lg:m-0 lg:border-0 lg:p-0">
        <SubmitButton
          isSubmitting={isSubmitting}
          className="w-full lg:w-auto"
          icon={<Save data-icon="inline-start" aria-hidden="true" />}
        >
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}

export default FunkoEditForm;
