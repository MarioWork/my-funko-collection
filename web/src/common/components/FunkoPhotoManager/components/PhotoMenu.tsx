import { ArrowDown, ArrowUp, RotateCw, Star, Trash2 } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  index: number;
  count: number;
  isPrimary: boolean;
  onMove: (direction: -1 | 1) => void;
  onMakePrimary: () => void;
  onRotate: () => void;
  onDelete: () => void;
};

// The edit-only menu of one photo: main photo, order (buttons, never drag-only), rotate, delete.
function PhotoMenu({ index, count, isPrimary, onMove, onMakePrimary, onRotate, onDelete }: Props) {
  const isFirst = index === 0;
  const isLast = index === count - 1;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DisabledReason
          reason={reasonWhen(isPrimary, 'This is already the main image.')}
          mode="wrapper"
          wrapperClassName="block"
        >
          <DropdownMenuItem disabled={isPrimary} onClick={onMakePrimary}>
            <Star aria-hidden="true" />
            Make primary
          </DropdownMenuItem>
        </DisabledReason>
        <DisabledReason
          reason={reasonWhen(isFirst, 'This image is already first.')}
          mode="wrapper"
          wrapperClassName="block"
        >
          <DropdownMenuItem disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp aria-hidden="true" />
            Move earlier
          </DropdownMenuItem>
        </DisabledReason>
        <DisabledReason
          reason={reasonWhen(isLast, 'This image is already last.')}
          mode="wrapper"
          wrapperClassName="block"
        >
          <DropdownMenuItem disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown aria-hidden="true" />
            Move later
          </DropdownMenuItem>
        </DisabledReason>
        <DropdownMenuItem onClick={onRotate}>
          <RotateCw aria-hidden="true" />
          Rotate 90°
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete image
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

export default PhotoMenu;
