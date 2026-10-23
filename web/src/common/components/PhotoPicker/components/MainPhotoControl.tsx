import { Star } from 'lucide-react';
import IconButton from '@components/IconButton';
import { Badge } from '@components/ui/badge';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import type { PendingPhoto } from '@utils/pendingPhotoUtils';

type Props = {
  photo: PendingPhoto;
  isMain: boolean;
  isDisabled: boolean;
  onMakeMain: (photo: PendingPhoto) => void;
};

// A thumbnail's top-left corner: a "Main" label on the main photo (text, not only a colour), a star on the others
// that makes that one main.
function MainPhotoControl({ photo, isMain, isDisabled, onMakeMain }: Props) {
  if (isMain) {
    return <Badge variant="secondary">Main</Badge>;
  }

  return (
    <IconButton
      aria-label={`Make ${photo.file.name} the main image`}
      size="sm"
      variant="secondary"
      disabled={isDisabled}
      disabledReason={DISABLED_REASONS.UPLOADING}
      onClick={() => onMakeMain(photo)}
    >
      <Star aria-hidden="true" />
    </IconButton>
  );
}

export default MainPhotoControl;
