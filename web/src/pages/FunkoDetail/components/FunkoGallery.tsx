import { useState } from 'react';
import type { FunkoDetailApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import FunkoImage from '@components/FunkoImage';
import Lightbox from '@components/Lightbox';
import PhotoThumbnail from '@components/PhotoThumbnail';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  funko: FunkoDetailApiModel;
};

const HERO_SIZES = '(min-width: 1024px) 480px, 100vw';
const NO_PHOTO_REASON = 'No photo yet. Use Edit to add one.';
const MAIN_PHOTO_INDEX = 0;

// The big frame, the thumbnail strip and the viewer, in a tile like the page's other sections (so the grey
// no-photo placeholder stands out from the page). A thumbnail only previews its photo in the frame; the main photo
// stays as it is (it changes in Edit). The frame opens the photo on show full size.
function FunkoGallery({ funko }: Props) {
  const [shownIndex, setShownIndex] = useState(MAIN_PHOTO_INDEX);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { images } = funko;
  // A photo deleted in Edit can leave the index past the end: fall back to the main photo.
  const isShownIndexValid = shownIndex < images.length;
  const heroIndex = isShownIndexValid ? shownIndex : MAIN_PHOTO_INDEX;
  const hero = images[heroIndex];
  const hasStrip = images.length > 1;

  return (
    <section aria-label="Photos" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <DisabledReason reason={reasonWhen(!hero, NO_PHOTO_REASON)} mode="wrapper" wrapperClassName="flex w-full">
        <button
          type="button"
          onClick={() => (hero ? setOpenIndex(heroIndex) : undefined)}
          disabled={!hero}
          aria-label={hero ? `Open photo ${heroIndex + 1} of ${images.length} full size` : undefined}
          className="mx-auto aspect-3/4 max-h-[55svh] w-full overflow-hidden rounded-2xl bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default @3xl:max-h-120"
        >
          <FunkoImage
            image={hero ?? null}
            alt={funko.name}
            sizes={HERO_SIZES}
            fit="contain"
            isPriority
            className="size-full"
          />
        </button>
      </DisabledReason>
      {hasStrip ? (
        <ul className="-m-1 flex gap-2 overflow-x-auto p-1" aria-label="All photos">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <PhotoThumbnail
                image={image}
                label={`Show photo ${index + 1} of ${images.length}${index === MAIN_PHOTO_INDEX ? ' (main photo)' : ''}`}
                isHighlighted={index === heroIndex}
                isPressed={index === heroIndex}
                onClick={() => setShownIndex(index)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <Lightbox images={images} openIndex={openIndex} title={funko.name} onClose={() => setOpenIndex(null)} />
    </section>
  );
}

export default FunkoGallery;
