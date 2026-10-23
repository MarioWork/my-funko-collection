import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import IconButton from '@components/IconButton';
import { cn } from '@utils/classNameUtils';

type Props = {
  index: number;
  count: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

// Light buttons on the dark photo backdrop.
const ON_MEDIA_BUTTON_CLASS = 'text-media-foreground hover:bg-media-foreground/10 hover:text-media-foreground';

// The X, and the arrows with the "2 / 5" counter when there is more than one image.
function LightboxControls({ index, count, onClose, onPrevious, onNext }: Props) {
  const hasSeveral = count > 1;

  return (
    <>
      <IconButton
        aria-label="Close"
        variant="ghost"
        className={cn('absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3', ON_MEDIA_BUTTON_CLASS)}
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </IconButton>
      {hasSeveral ? (
        <>
          <IconButton
            aria-label="Previous image"
            variant="ghost"
            size="lg"
            className={cn('absolute left-2', ON_MEDIA_BUTTON_CLASS)}
            onClick={onPrevious}
          >
            <ChevronLeft aria-hidden="true" />
          </IconButton>
          <IconButton
            aria-label="Next image"
            variant="ghost"
            size="lg"
            className={cn('absolute right-2', ON_MEDIA_BUTTON_CLASS)}
            onClick={onNext}
          >
            <ChevronRight aria-hidden="true" />
          </IconButton>
          <p className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] text-sm text-media-foreground/80 tabular-nums">
            {index + 1} / {count}
          </p>
        </>
      ) : null}
    </>
  );
}

export default LightboxControls;
