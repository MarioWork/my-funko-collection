import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Spinner } from '@components/ui/spinner';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { DISABLED_REASONS, firstReason } from '@utils/disabledReasonUtils';

type Props = {
  item: CollectionItemApiModel;
  isBusy: boolean;
  onRemove: (item: CollectionItemApiModel) => void;
};

type MembershipActionsContentProps = {
  item: CollectionItemApiModel;
  editPath: string;
  onRemove: (item: CollectionItemApiModel) => void;
};

function MembershipActionsContent({ item, editPath, onRemove }: MembershipActionsContentProps) {
  return (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link to={editPath} />}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem variant="destructive" onClick={() => onRemove(item)}>
          <Trash2 aria-hidden="true" />
          Remove from {item.collection.name}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

// The row's ⋯: Edit (the item sheet over this page) and Remove from the collection (undoable from the toast). The
// button spins while a removal runs. Both are writes, so a read-only user gets the button disabled, saying why.
function MembershipActions({ item, isBusy, onRemove }: Props) {
  const readOnlyReason = useReadOnlyReason();
  const editPath = FUNKO_ROUTES_PATHS.editItem(String(item.funko.id), String(item.collection.id), String(item.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            aria-label={`Actions for ${item.collection.name}`}
            variant="ghost"
            size="sm"
            className="rounded-full"
            disabled={isBusy || readOnlyReason !== undefined}
            disabledReason={firstReason(readOnlyReason, DISABLED_REASONS.WORKING)}
          />
        }
      >
        {isBusy ? <Spinner /> : <MoreHorizontal aria-hidden="true" />}
      </DropdownMenuTrigger>
      <MembershipActionsContent item={item} editPath={editPath} onRemove={onRemove} />
    </DropdownMenu>
  );
}

export default MembershipActions;
