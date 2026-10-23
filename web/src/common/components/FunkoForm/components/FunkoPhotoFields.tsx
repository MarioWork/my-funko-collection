import type { FunkoDetailApiModel } from '@app-types/models';
import FunkoPhotoManager from '@components/FunkoPhotoManager';
import PhotoPicker from '@components/PhotoPicker';
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '@components/ui/field';
import type { usePendingPhotos } from '../hooks/usePendingPhotos';

type Props = {
  // Editing: the funko's photos, changed in place. Adding: undefined, and the picked photos wait for Save.
  funko: FunkoDetailApiModel | undefined;
  formId: string;
  pendingPhotos: ReturnType<typeof usePendingPhotos>;
  isSubmitting: boolean;
  isMissingPhotos: boolean;
};

const PHOTOS_REQUIRED_MESSAGE = 'Add at least one photo';

// The photos part of FunkoForm. Adding: pick at least one, sent with Save. Editing: the photo manager, where every
// change applies right away.
function FunkoPhotoFields({ funko, formId, pendingPhotos, isSubmitting, isMissingPhotos }: Props) {
  const errorId = `${formId}-photos-error`;

  if (funko) {
    return (
      <FieldSet className="gap-3">
        <FieldLegend variant="label">Photos</FieldLegend>
        <FieldDescription>Changes to photos apply right away.</FieldDescription>
        <FunkoPhotoManager funko={funko} />
      </FieldSet>
    );
  }

  return (
    <FieldSet className="gap-3" data-invalid={isMissingPhotos || undefined}>
      <FieldLegend variant="label">Photos</FieldLegend>
      <PhotoPicker
        photos={pendingPhotos.photos}
        isDisabled={isSubmitting}
        onAdd={pendingPhotos.add}
        onRemove={pendingPhotos.remove}
        errorId={isMissingPhotos ? errorId : undefined}
      />
      {isMissingPhotos ? <FieldError id={errorId}>{PHOTOS_REQUIRED_MESSAGE}</FieldError> : null}
    </FieldSet>
  );
}

export default FunkoPhotoFields;
