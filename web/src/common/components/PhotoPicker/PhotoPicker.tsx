import { Camera, ImagePlus } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { Button } from '@components/ui/button';
import { LIBRARY_ACCEPT, MAX_PHOTOS_PER_BATCH, type PendingPhoto } from '@utils/pendingPhotoUtils';
import PendingPhotoList from './components/PendingPhotoList';
import DisabledReason from '@components/DisabledReason';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

const FULL_BATCH_REASON = `${MAX_PHOTOS_PER_BATCH} photos is the most at once. Remove one to add another.`;

type Props = {
  photos: PendingPhoto[];
  isDisabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (photo: PendingPhoto) => void;
  // When the caller needs a photo and has none: the id of the message to link to the pick button.
  errorId?: string;
  // Rendered after the pick buttons, e.g. an Upload button.
  children?: React.ReactNode;
};

// Pick from the library (several) or take one photo, and see previews. Holds no photos itself: the caller decides
// when they are sent.
function PhotoPicker({ photos, isDisabled, onAdd, onRemove, errorId, children }: Props) {
  const libraryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const canAddMore = photos.length < MAX_PHOTOS_PER_BATCH;
  const pickDisabledReason = isDisabled ? DISABLED_REASONS.UPLOADING : reasonWhen(!canAddMore, FULL_BATCH_REASON);

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS_PER_BATCH - photos.length);

    onAdd(files);
    // iOS replaces input.files each time; clearing lets the same picker add again.
    event.target.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={libraryInput}
        type="file"
        accept={LIBRARY_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Photo files"
        onChange={addFiles}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/jpeg"
        capture="environment"
        className="sr-only"
        aria-label="Camera photo"
        onChange={addFiles}
      />
      <div className="flex flex-wrap gap-2">
        <DisabledReason reason={pickDisabledReason}>
          <Button
            type="button"
            variant="outline"
            disabled={!canAddMore || isDisabled}
            aria-invalid={errorId ? true : undefined}
            aria-describedby={errorId}
            onClick={() => libraryInput.current?.click()}
          >
            <ImagePlus data-icon="inline-start" aria-hidden="true" />
            Choose photos
          </Button>
        </DisabledReason>
        <DisabledReason reason={pickDisabledReason}>
          <Button
            type="button"
            variant="outline"
            className="pointer-fine:hidden"
            disabled={!canAddMore || isDisabled}
            onClick={() => cameraInput.current?.click()}
          >
            <Camera data-icon="inline-start" aria-hidden="true" />
            Take photo
          </Button>
        </DisabledReason>
        {children}
      </div>
      <PendingPhotoList photos={photos} isDisabled={isDisabled} onRemove={onRemove} />
    </div>
  );
}

export default PhotoPicker;
