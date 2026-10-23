import { useState } from 'react';
import Lightbox from '@components/Lightbox';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';
import { cn } from '@utils/classNameUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';
import ThumbnailControls from './ThumbnailControls';

type Props = {
  photos: PendingPhoto[];
  isDisabled: boolean;
  onRemove: (photo: PendingPhoto) => void;
  // Set when the first photo is the main one and another can be made main.
  onMakeMain?: (photo: PendingPhoto) => Promise<void>;
};

const LIST_LABEL = 'Images to upload';
const VIEW_BUTTON_ID_PREFIX = 'pending-photo-view';
// Names each thumbnail for the View Transition when one is made main; the class picks up its timing in index.css.
const TRANSITION_NAME_PREFIX = 'pending-photo';

function viewButtonId(photo: PendingPhoto): string {
  return `${VIEW_BUTTON_ID_PREFIX}-${photo.id}`;
}

// The picked photos as thumbnails: click one to see it big (and flip through the rest), make it main, or remove it.
function PendingPhotoList({ photos, isDisabled, onRemove, onMakeMain }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const viewerImages = photos.map((photo) => ({ id: photo.id, url: photo.previewUrl }));

  // The star the user pressed turns into the "Main" label, so focus follows the photo to its new place.
  const makeMain = async (photo: PendingPhoto) => {
    await onMakeMain?.(photo);
    document.getElementById(viewButtonId(photo))?.focus();
  };

  if (photos.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-4 gap-2 @md:grid-cols-6" aria-label={LIST_LABEL}>
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            style={{ viewTransitionName: `${TRANSITION_NAME_PREFIX}-${photo.id}` }}
            className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted [view-transition-class:pending-photo]"
          >
            <button
              id={viewButtonId(photo)}
              type="button"
              aria-label={`View ${photo.file.name}`}
              onClick={() => setOpenIndex(index)}
              className={cn('size-full cursor-zoom-in', LINK_FOCUS_CLASS)}
            >
              <img src={photo.previewUrl} alt="" className="size-full object-cover" />
            </button>
            <ThumbnailControls
              photo={photo}
              isMain={index === 0}
              isDisabled={isDisabled}
              onRemove={onRemove}
              onMakeMain={onMakeMain ? (chosen) => void makeMain(chosen) : undefined}
            />
          </li>
        ))}
      </ul>
      <Lightbox images={viewerImages} openIndex={openIndex} title={LIST_LABEL} onClose={() => setOpenIndex(null)} />
    </>
  );
}

export default PendingPhotoList;
