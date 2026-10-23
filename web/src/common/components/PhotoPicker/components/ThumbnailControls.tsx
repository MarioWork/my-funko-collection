import { X } from 'lucide-react';
import IconButton from '@components/IconButton';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';
import MainPhotoControl from './MainPhotoControl';

type Props = {
  photo: PendingPhoto;
  isMain: boolean;
  isDisabled: boolean;
  onRemove: (photo: PendingPhoto) => void;
  // Set when the first photo is the main one and another can be made main.
  onMakeMain?: (photo: PendingPhoto) => void;
};

// The bar over a thumbnail's top edge: main label or star on the left, remove on the right. The bar is what is
// placed over the photo, not the buttons: IconButton turns itself `relative` on touch screens (its larger tap
// area), which would undo an `absolute` set on the button itself.
function ThumbnailControls({ photo, isMain, isDisabled, onRemove, onMakeMain }: Props) {
  return (
    <div className="absolute inset-x-1 top-1 flex items-start justify-between">
      {onMakeMain ? (
        <MainPhotoControl photo={photo} isMain={isMain} isDisabled={isDisabled} onMakeMain={onMakeMain} />
      ) : null}
      <IconButton
        aria-label={`Remove ${photo.file.name}`}
        size="sm"
        variant="secondary"
        className="ml-auto"
        disabled={isDisabled}
        disabledReason={DISABLED_REASONS.UPLOADING}
        onClick={() => onRemove(photo)}
      >
        <X aria-hidden="true" />
      </IconButton>
    </div>
  );
}

export default ThumbnailControls;
