import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@components/ui/dialog';
import { LARGE_IMAGE_WIDTH_PX, MEDIUM_IMAGE_WIDTH_PX } from '@utils/imageSizeUtils';
import LightboxControls from './components/LightboxControls';
import type { LightboxImage } from './types';

type Props = {
  images: LightboxImage[];
  openIndex: number | null;
  title: string;
  onClose: () => void;
};

const SWIPE_THRESHOLD_PX = 48;

// Full-screen photo viewer: arrows and keys to move, swipe on touch, Escape or the X to close, focus trapped
// by the dialog. The large size loads here and nowhere else.
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
    // showPrevious / showNext are new functions each render, but they only read `count` (already a dependency) and
    // call setIndex with an updater, so listing them would only re-subscribe on every render.
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
        className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-media p-0 text-media-foreground sm:max-w-none"
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
            srcSet={
              image.mediumUrl
                ? `${image.mediumUrl} ${MEDIUM_IMAGE_WIDTH_PX}w, ${image.url} ${LARGE_IMAGE_WIDTH_PX}w`
                : undefined
            }
            sizes="100vw"
            alt={`${title}, ${index + 1} of ${count}`}
            width={image.width}
            height={image.height}
            className="max-h-dvh max-w-full object-contain motion-safe:animate-in motion-safe:fade-in"
          />
          <LightboxControls index={index} count={count} onClose={onClose} onPrevious={showPrevious} onNext={showNext} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Lightbox;
