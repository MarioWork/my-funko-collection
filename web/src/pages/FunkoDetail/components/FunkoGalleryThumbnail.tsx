import { ArrowDown, ArrowUp, MoreHorizontal, RotateCw, Star, Trash2 } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { FunkoImageApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@utils/classNameUtils';
import { createFormData } from '@utils/formDataUtils';

type Props = {
  image: FunkoImageApiModel;
  index: number;
  count: number;
  funkoId: number;
  isPrimary: boolean;
  onOpen: () => void;
  onMove: (direction: -1 | 1) => void;
  onMakePrimary: () => void;
};

type MenuProps = Pick<Props, 'index' | 'count' | 'isPrimary' | 'onMove' | 'onMakePrimary'> & {
  onRotate: () => void;
  onDelete: () => void;
};

const THUMB_SIZES = '96px';
const QUARTER_TURN = 90;

function ThumbnailMenu({ index, count, isPrimary, onMove, onMakePrimary, onRotate, onDelete }: MenuProps) {
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem disabled={isPrimary} onClick={onMakePrimary}>
          <Star aria-hidden="true" />
          Make primary
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp aria-hidden="true" />
          Move earlier
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDown aria-hidden="true" />
          Move later
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRotate}>
          <RotateCw aria-hidden="true" />
          Rotate 90°
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete photo
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

// One photo in the strip: opens the lightbox; its menu reorders (buttons, never drag-only), rotates and deletes.
function FunkoGalleryThumbnail({ image, index, count, funkoId, isPrimary, onOpen, onMove, onMakePrimary }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const imagePath = FUNKO_ROUTES_PATHS.image(String(funkoId), String(image.id));
  const isBusy = fetcher.state !== 'idle';

  const rotate = () =>
    void fetcher.submit(createFormData({ degrees: QUARTER_TURN }), { method: HttpVerbsUtil.POST, action: imagePath });
  const remove = () => void fetcher.submit(null, { method: HttpVerbsUtil.DELETE, action: imagePath });

  return (
    <li className={cn('relative shrink-0', isBusy && 'opacity-60')}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open photo ${index + 1} of ${count}`}
        className={cn(
          'block aspect-3/4 w-20 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isPrimary && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}
      >
        <FunkoImage image={image} alt="" sizes={THUMB_SIZES} className="size-full" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              aria-label={`Photo ${index + 1} options`}
              size="sm"
              variant="secondary"
              className="absolute top-1 right-1"
            />
          }
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <ThumbnailMenu
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

export default FunkoGalleryThumbnail;
