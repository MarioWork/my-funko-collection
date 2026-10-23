import PhotoPicker from '@components/PhotoPicker';
import { PAGE_ICONS } from '@utils/navigationUtils';
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
    <FormSection
      id={SECTION_ID}
      icon={PAGE_ICONS.IMAGES}
      title="Images"
      description="At least one. The main one is what the grid shows; the star makes another one main."
    >
      <PhotoPicker
        photos={pendingPhotos.photos}
        isDisabled={isSubmitting}
        onAdd={pendingPhotos.add}
        onRemove={pendingPhotos.remove}
        onMakeMain={pendingPhotos.makeMain}
        errorId={isMissingPhotos ? ERROR_ID : undefined}
      />
      {isMissingPhotos ? <FieldError id={ERROR_ID}>{PHOTOS_REQUIRED_MESSAGE}</FieldError> : null}
    </FormSection>
  );
}

export default AddPhotosSection;
