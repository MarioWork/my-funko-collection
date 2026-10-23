import { MoreHorizontal } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { FunkoId, FunkoImageApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import { DropdownMenu, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { cn } from '@utils/classNameUtils';
import { createFormData } from '@utils/formDataUtils';
import PhotoMenu from './PhotoMenu';
import PhotoThumbnail from '@components/PhotoThumbnail';
import type { MoveDirection } from '../types';

type Props = {
  image: FunkoImageApiModel;
  index: number;
  count: number;
  funkoId: FunkoId;
  isPrimary: boolean;
  onOpen: () => void;
  onMove: (direction: MoveDirection) => void;
  onMakePrimary: () => void;
};

const QUARTER_TURN = 90;

// A photo in the edit strip: opens the viewer, and its ⋯ menu changes it right away (rotate and delete here, order
// through the parent's single PATCH).
function EditablePhotoThumbnail({ image, index, count, funkoId, isPrimary, onOpen, onMove, onMakePrimary }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const imagePath = FUNKO_ROUTES_PATHS.image(String(funkoId), String(image.id));
  const isBusy = fetcher.state !== 'idle';

  const rotate = () =>
    void fetcher.submit(createFormData({ degrees: QUARTER_TURN }), { method: HttpVerbsUtil.POST, action: imagePath });
  const remove = () => void fetcher.submit(null, { method: HttpVerbsUtil.DELETE, action: imagePath });

  return (
    <li className={cn('relative shrink-0', isBusy && 'opacity-60')}>
      <PhotoThumbnail
        image={image}
        label={`Open image ${index + 1} of ${count}${isPrimary ? ' (main image)' : ''}`}
        isHighlighted={isPrimary}
        onClick={onOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              aria-label={`Image ${index + 1} options`}
              size="sm"
              variant="secondary"
              className="absolute top-1 right-1"
            />
          }
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <PhotoMenu
          index={index}
          count={count}
          isPrimary={isPrimary}
          onMove={onMove}
          onMakePrimary={onMakePrimary}
          onRotate={rotate}
          onDelete={remove}
        />
      </DropdownMenu>
    </li>
  );
}

export default EditablePhotoThumbnail;
