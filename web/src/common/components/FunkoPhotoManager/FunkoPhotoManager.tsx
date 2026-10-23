import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import Lightbox from '@components/Lightbox';
import PhotoUploader from '@components/PhotoUploader';
import { createFormData } from '@utils/formDataUtils';
import EditablePhotoThumbnail from './components/EditablePhotoThumbnail';

type Props = {
  funko: FunkoDetailApiModel;
};

// The photos while editing: each one's ⋯ menu (main photo, order, rotate, delete) and the uploader. These changes
// apply right away, as each one is saved on its own; order changes go through one PATCH.
function FunkoPhotoManager({ funko }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const orderFetcher = useFetcher<JSONResponseUtil>();
  const { images } = funko;
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
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <ul className="-m-1 flex gap-2 overflow-x-auto p-1" aria-label="Images">
          {images.map((image, index) => (
            <EditablePhotoThumbnail
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
    </div>
  );
}

export default FunkoPhotoManager;
