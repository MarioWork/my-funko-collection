import { Camera, ImagePlus } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import InlineAlert from '@components/InlineAlert';
import {
  CAMERA_ACCEPT,
  isTooLargePhoto,
  LIBRARY_ACCEPT,
  MAX_PHOTO_MEGABYTES,
  MAX_PHOTOS_PER_BATCH,
  type PendingPhoto,
} from '@utils/pendingPhotoUtils';
import PendingPhotoList from './components/PendingPhotoList';
import PickButton from './components/PickButton';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

const FULL_BATCH_REASON = `${MAX_PHOTOS_PER_BATCH} images is the most at once. Remove one to add another.`;

function tooLargeMessage(fileNames: string[]): string {
  const subject = fileNames.length === 1 ? `${fileNames[0]} is` : `${fileNames.join(', ')} are`;

  return `${subject} over ${MAX_PHOTO_MEGABYTES} MB, so left out. Pick a smaller image.`;
}

type Props = {
  photos: PendingPhoto[];
  isDisabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (photo: PendingPhoto) => void;
  // When the caller needs a photo and has none: the id of the message to link to the pick button.
  errorId?: string;
  // Rendered after the pick buttons, e.g. an Upload button.
  children?: ReactNode;
};

// Pick from the library (several) or take one photo, and see previews. Holds no photos itself: the caller decides
// when they are sent.
function PhotoPicker({ photos, isDisabled, onAdd, onRemove, errorId, children }: Props) {
  const libraryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const canAddMore = photos.length < MAX_PHOTOS_PER_BATCH;
  const pickDisabledReason = isDisabled ? DISABLED_REASONS.UPLOADING : reasonWhen(!canAddMore, FULL_BATCH_REASON);
  // The files of the last pick that were over the size limit, named in a message until the next pick.
  const [tooLargeNames, setTooLargeNames] = useState<string[]>([]);

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    const tooLarge = picked.filter(isTooLargePhoto);
    const files = picked.filter((file) => !isTooLargePhoto(file)).slice(0, MAX_PHOTOS_PER_BATCH - photos.length);

    setTooLargeNames(tooLarge.map((file) => file.name));
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
        // Opened by the visible buttons below; out of the tab order so focus never lands on an invisible input.
        tabIndex={-1}
        aria-label="Image files"
        onChange={addFiles}
      />
      <input
        ref={cameraInput}
        type="file"
        accept={CAMERA_ACCEPT}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Camera photo"
        onChange={addFiles}
      />
      <div className="flex flex-wrap gap-2">
        <PickButton
          label="Choose images"
          icon={ImagePlus}
          isDisabled={!canAddMore || isDisabled}
          disabledReason={pickDisabledReason}
          errorId={errorId}
          onClick={() => libraryInput.current?.click()}
        />
        <PickButton
          label="Take photo"
          icon={Camera}
          isDisabled={!canAddMore || isDisabled}
          disabledReason={pickDisabledReason}
          className="pointer-fine:hidden"
          onClick={() => cameraInput.current?.click()}
        />
        {children}
      </div>
      {tooLargeNames.length > 0 ? <InlineAlert tone="error">{tooLargeMessage(tooLargeNames)}</InlineAlert> : null}
      <PendingPhotoList photos={photos} isDisabled={isDisabled} onRemove={onRemove} />
    </div>
  );
}

export default PhotoPicker;
