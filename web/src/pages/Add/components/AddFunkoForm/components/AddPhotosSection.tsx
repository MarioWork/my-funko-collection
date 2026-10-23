import PhotoPicker from '@components/PhotoPicker';
import { FieldError } from '@components/ui/field';
import type { usePendingPhotos } from '../hooks/usePendingPhotos';
import FormSection from './FormSection';

type Props = {
  pendingPhotos: ReturnType<typeof usePendingPhotos>;
  isSubmitting: boolean;
  isMissingPhotos: boolean;
};

const SECTION_ID = 'add-images';
const PHOTOS_REQUIRED_MESSAGE = 'Add at least one image';
const ERROR_ID = `${SECTION_ID}-error`;

// First on the page: the photo is what the grid shows. At least one, sent with Save.
function AddPhotosSection({ pendingPhotos, isSubmitting, isMissingPhotos }: Props) {
  return (
    <FormSection id={SECTION_ID} title="Images" description="At least one. The first is the one the grid shows.">
      <PhotoPicker
        photos={pendingPhotos.photos}
        isDisabled={isSubmitting}
        onAdd={pendingPhotos.add}
        onRemove={pendingPhotos.remove}
        errorId={isMissingPhotos ? ERROR_ID : undefined}
      />
      {isMissingPhotos ? <FieldError id={ERROR_ID}>{PHOTOS_REQUIRED_MESSAGE}</FieldError> : null}
    </FormSection>
  );
}

export default AddPhotosSection;
