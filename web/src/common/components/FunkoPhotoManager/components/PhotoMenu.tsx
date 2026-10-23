import { ArrowDown, ArrowUp, RotateCw, Star, Trash2 } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu';
import type { MoveDirection } from '../types';
import DisabledMenuItem from './DisabledMenuItem';

type Props = {
  index: number;
  count: number;
  isPrimary: boolean;
  onMove: (direction: MoveDirection) => void;
  onMakePrimary: () => void;
  onRotate: () => void;
  onDelete: () => void;
};

const MOVE_EARLIER: MoveDirection = -1;
const MOVE_LATER: MoveDirection = 1;

// The edit-only menu of one photo: main photo, order (buttons, never drag-only), rotate, delete.
function PhotoMenu({ index, count, isPrimary, onMove, onMakePrimary, onRotate, onDelete }: Props) {
  const isFirst = index === 0;
  const isLast = index === count - 1;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DisabledMenuItem
          label="Make primary"
          icon={Star}
          isDisabled={isPrimary}
          disabledReason="This is already the main image."
          onClick={onMakePrimary}
        />
        <DisabledMenuItem
          label="Move earlier"
          icon={ArrowUp}
          isDisabled={isFirst}
          disabledReason="This image is already first."
          onClick={() => onMove(MOVE_EARLIER)}
        />
        <DisabledMenuItem
          label="Move later"
          icon={ArrowDown}
          isDisabled={isLast}
          disabledReason="This image is already last."
          onClick={() => onMove(MOVE_LATER)}
        />
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
