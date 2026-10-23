import { X } from 'lucide-react';
import { useState } from 'react';
import IconButton from '@components/IconButton';
import Lightbox from '@components/Lightbox';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';
import { cn } from '@utils/classNameUtils';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';
import MainPhotoControl from './MainPhotoControl';

type Props = {
  photos: PendingPhoto[];
  isDisabled: boolean;
  onRemove: (photo: PendingPhoto) => void;
  // Set when the first photo is the main one and another can be made main.
  onMakeMain?: (photo: PendingPhoto) => void;
};

const LIST_LABEL = 'Images to upload';

// The picked photos as thumbnails: click one to see it big (and flip through the rest), make it main, or remove it.
function PendingPhotoList({ photos, isDisabled, onRemove, onMakeMain }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const viewerImages = photos.map((photo) => ({ id: photo.id, url: photo.previewUrl }));

  if (photos.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-4 gap-2 @md:grid-cols-6" aria-label={LIST_LABEL}>
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
            <button
              type="button"
              aria-label={`View ${photo.file.name}`}
              onClick={() => setOpenIndex(index)}
              className={cn('size-full cursor-zoom-in', LINK_FOCUS_CLASS)}
            >
              <img src={photo.previewUrl} alt="" className="size-full object-cover" />
            </button>
            {onMakeMain ? (
              <MainPhotoControl photo={photo} isMain={index === 0} isDisabled={isDisabled} onMakeMain={onMakeMain} />
            ) : null}
            <IconButton
              aria-label={`Remove ${photo.file.name}`}
              size="sm"
              variant="secondary"
              className="absolute top-1 right-1"
              disabled={isDisabled}
              disabledReason={DISABLED_REASONS.UPLOADING}
              onClick={() => onRemove(photo)}
            >
              <X aria-hidden="true" />
            </IconButton>
          </li>
        ))}
      </ul>
      <Lightbox images={viewerImages} openIndex={openIndex} title={LIST_LABEL} onClose={() => setOpenIndex(null)} />
    </>
  );
}

export default PendingPhotoList;
