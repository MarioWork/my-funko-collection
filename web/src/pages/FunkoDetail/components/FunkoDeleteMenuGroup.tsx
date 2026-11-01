import { Trash2 } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from '@components/ui/dropdown-menu';

type Props = {
  // Set for a read-only user: Delete shows disabled, saying why.
  readOnlyReason: string | undefined;
  onDelete: () => void;
};

function DeleteItem({ readOnlyReason, onDelete }: Props) {
  return (
    <DisabledReason reason={readOnlyReason} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem variant="destructive" disabled={readOnlyReason !== undefined} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
        Delete
      </DropdownMenuItem>
    </DisabledReason>
  );
}

// The ⋯ menu's last group: Delete on its own, after a separator.
function FunkoDeleteMenuGroup({ readOnlyReason, onDelete }: Props) {
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DeleteItem readOnlyReason={readOnlyReason} onDelete={onDelete} />
      </DropdownMenuGroup>
    </>
  );
}

export default FunkoDeleteMenuGroup;
