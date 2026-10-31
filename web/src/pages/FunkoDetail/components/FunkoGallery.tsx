import { useState } from 'react';
import type { FunkoDetailApiModel, FunkoImageApiModel } from '@app-types/models';
import DisabledReason from '@components/DisabledReason';
import FunkoImage from '@components/FunkoImage';
import Lightbox from '@components/Lightbox';
import PhotoThumbnail from '@components/PhotoThumbnail';
import { reasonWhen } from '@utils/disabledReasonUtils';
import ImageDownloadButton from '@components/ImageDownloadButton';
import { useCanEditFunko } from '@hooks/useCanEditFunko';

type Props = {
  funko: FunkoDetailApiModel;
};

type FrameProps = {
  funkoName: string;
  hero: FunkoImageApiModel | undefined;
  heroIndex: number;
  imageCount: number;
  canEdit: boolean;
  onOpen: () => void;
};

const HERO_SIZES = '(min-width: 1024px) 480px, 100vw';
const NO_PHOTO_REASON = 'No image yet. Use Edit to add one.';
// Without Edit (a catalogue funko, for a member): only an admin adds images to it.
const MEMBER_NO_PHOTO_REASON = 'No image yet. An admin can add one.';
const MAIN_PHOTO_INDEX = 0;
// The big frame: the shown image, a button that opens it full size, and its download button in the corner.
function GalleryFrame({ funkoName, hero, heroIndex, imageCount, canEdit, onOpen }: FrameProps) {
  const noPhotoReason = canEdit ? NO_PHOTO_REASON : MEMBER_NO_PHOTO_REASON;

  return (
    <div className="relative">
      <DisabledReason reason={reasonWhen(!hero, noPhotoReason)} mode="wrapper" wrapperClassName="flex w-full">
        <button
          type="button"
          onClick={onOpen}
          disabled={!hero}
          aria-label={hero ? `Open image ${heroIndex + 1} of ${imageCount} full size` : undefined}
          className="mx-auto aspect-3/4 max-h-[55svh] w-full overflow-hidden rounded-2xl bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default @3xl:max-h-120"
        >
          <FunkoImage
            image={hero ?? null}
            alt={funkoName}
            sizes={HERO_SIZES}
            fit="contain"
            isPriority
            className="size-full"
          />
        </button>
      </DisabledReason>
      {hero ? (
        <ImageDownloadButton
          url={hero.url}
          funkoName={funkoName}
          imageNumber={heroIndex + 1}
          // Beside (not inside) the button that opens the viewer, pinned to the frame's corner.
          className="absolute right-2 bottom-3"
        />
      ) : null}
    </div>
  );
}

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
  const canEdit = useCanEditFunko(funko);

  return (
    <section aria-label="Images" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <GalleryFrame
        funkoName={funko.name}
        hero={hero}
        heroIndex={heroIndex}
        imageCount={images.length}
        canEdit={canEdit}
        onOpen={() => setOpenIndex(heroIndex)}
      />
      {hasStrip ? (
        <ul className="-m-1 flex gap-2 overflow-x-auto p-1" aria-label="All images">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <PhotoThumbnail
                image={image}
                label={`Show image ${index + 1} of ${images.length}${index === MAIN_PHOTO_INDEX ? ' (main image)' : ''}`}
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
