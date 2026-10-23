import type { FunkoImageApiModel } from '@app-types/models';
import FunkoImage from '@components/FunkoImage';
import { cn } from '@utils/classNameUtils';

type Props = {
  image: FunkoImageApiModel;
  // The button's name: "Show photo 2 of 3", "Open photo 1 of 3 (main photo)".
  label: string;
  // Ringed: the photo shown in the big frame (funko page) or the main photo (edit).
  isHighlighted: boolean;
  // Set where the thumbnails pick the photo on show, so assistive tech hears which one is picked.
  isPressed?: boolean;
  onClick: () => void;
};

const THUMB_SIZES = '96px';

// One small photo in a strip.
function PhotoThumbnail({ image, label, isHighlighted, isPressed, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isPressed}
      className={cn(
        'block aspect-3/4 w-20 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <FunkoImage image={image} alt="" sizes={THUMB_SIZES} className="size-full" />
    </button>
  );
}

export default PhotoThumbnail;
