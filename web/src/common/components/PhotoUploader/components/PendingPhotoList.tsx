import { X } from 'lucide-react';
import IconButton from '@components/IconButton';
import type { PendingPhoto } from '../photoUploaderUtils';

type Props = {
  photos: PendingPhoto[];
  isDisabled: boolean;
  onRemove: (photo: PendingPhoto) => void;
};

function PendingPhotoList({ photos, isDisabled, onRemove }: Props) {
  if (photos.length === 0) return null;

  return (
    <ul className="grid grid-cols-4 gap-2 @md:grid-cols-6" aria-label="Photos to upload">
      {photos.map((photo) => (
        <li key={photo.id} className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
          <img src={photo.previewUrl} alt="" className="size-full object-cover" />
          <IconButton
            aria-label={`Remove ${photo.file.name}`}
            size="sm"
            variant="secondary"
            className="absolute top-1 right-1"
            disabled={isDisabled}
            onClick={() => onRemove(photo)}
          >
            <X aria-hidden="true" />
          </IconButton>
        </li>
      ))}
    </ul>
  );
}

export default PendingPhotoList;
