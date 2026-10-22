import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import Lightbox from '@components/Lightbox';
import PhotoUploader from '@components/PhotoUploader';
import { createFormData } from '@utils/formDataUtils';
import FunkoGalleryThumbnail from './FunkoGalleryThumbnail';

type Props = {
  funko: FunkoDetailApiModel;
};

const HERO_SIZES = '(min-width: 1024px) 480px, 100vw';

// Hero photo, the thumbnail strip, the uploader, and the lightbox. Order changes go through one PATCH.
function FunkoGallery({ funko }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const orderFetcher = useFetcher<JSONResponseUtil>();
  const { images } = funko;
  const hero = images[0];
  const imagesPath = FUNKO_ROUTES_PATHS.images(String(funko.id));

  const submitOrder = (imageIds: number[]) =>
    void orderFetcher.submit(createFormData({ imageIds }), { method: HttpVerbsUtil.PATCH, action: imagesPath });

  const move = (index: number, direction: -1 | 1) => {
    const ids = images.map((image) => image.id);
    const [moved] = ids.splice(index, 1);

    if (moved === undefined) return;

    ids.splice(index + direction, 0, moved);
    submitOrder(ids);
  };

  const makePrimary = (index: number) => {
    const ids = images.map((image) => image.id);
    const [chosen] = ids.splice(index, 1);

    if (chosen !== undefined) submitOrder([chosen, ...ids]);
  };

  return (
    <section aria-label="Photos" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => (hero ? setOpenIndex(0) : undefined)}
        disabled={!hero}
        aria-label={hero ? 'Open photos' : undefined}
        className="mx-auto aspect-3/4 max-h-[55svh] w-full overflow-hidden rounded-2xl bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default @3xl:max-h-none"
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
      {images.length > 0 ? (
        <ul className="-m-1 flex gap-2 overflow-x-auto p-1" aria-label="All photos">
          {images.map((image, index) => (
            <FunkoGalleryThumbnail
              key={image.id}
              image={image}
              index={index}
              count={images.length}
              funkoId={funko.id}
              isPrimary={index === 0}
              onOpen={() => setOpenIndex(index)}
              onMove={(direction) => move(index, direction)}
              onMakePrimary={() => makePrimary(index)}
            />
          ))}
        </ul>
      ) : null}
      <PhotoUploader actionPath={imagesPath} />
      <Lightbox images={images} openIndex={openIndex} title={funko.name} onClose={() => setOpenIndex(null)} />
    </section>
  );
}

export default FunkoGallery;
