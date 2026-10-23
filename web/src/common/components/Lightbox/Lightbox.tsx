import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FunkoImageApiModel } from '@app-types/models';
import IconButton from '@components/IconButton';
import { Dialog, DialogContent, DialogTitle } from '@components/ui/dialog';

type Props = {
  images: FunkoImageApiModel[];
  openIndex: number | null;
  title: string;
  onClose: () => void;
};

const SWIPE_THRESHOLD_PX = 48;

// Full-screen photo viewer: arrows and keys to move, swipe on touch, Escape or the X to close, focus trapped
// by the dialog. The large variant loads here and nowhere else.
function Lightbox({ images, openIndex, title, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isOpen = openIndex !== null && images.length > 0;
  const count = images.length;

  // Adopt the index the caller opened with (derived during render, no effect).
  if (openIndex !== openedAt) {
    setOpenedAt(openIndex);
    if (openIndex !== null) setIndex(openIndex);
  }

  const showPrevious = () => setIndex((current) => (current - 1 + count) % count);
  const showNext = () => setIndex((current) => (current + 1) % count);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, count]);

  const image = images[index];

  if (!image) return null;

  const handleTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return;

    const distance = endX - touchStartX.current;

    if (distance > SWIPE_THRESHOLD_PX) showPrevious();
    if (distance < -SWIPE_THRESHOLD_PX) showNext();

    touchStartX.current = null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
      >
        <DialogTitle className="sr-only">
          {title}, image {index + 1} of {count}
        </DialogTitle>
        <div
          className="relative flex size-full items-center justify-center"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <img
            key={image.id}
            src={image.url}
            srcSet={`${image.mediumUrl} 1200w, ${image.url} 2000w`}
            sizes="100vw"
            alt={`${title}, ${index + 1} of ${count}`}
            width={image.width}
            height={image.height}
            className="max-h-dvh max-w-full object-contain motion-safe:animate-in motion-safe:fade-in"
          />
          <IconButton
            aria-label="Close"
            variant="ghost"
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 text-white hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </IconButton>
          {count > 1 ? (
            <>
              <IconButton
                aria-label="Previous image"
                variant="ghost"
                size="lg"
                className="absolute left-2 text-white hover:bg-white/10 hover:text-white"
                onClick={showPrevious}
              >
                <ChevronLeft aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Next image"
                variant="ghost"
                size="lg"
                className="absolute right-2 text-white hover:bg-white/10 hover:text-white"
                onClick={showNext}
              >
                <ChevronRight aria-hidden="true" />
              </IconButton>
              <p className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] text-sm text-white/80 tabular-nums">
                {index + 1} / {count}
              </p>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Lightbox;
