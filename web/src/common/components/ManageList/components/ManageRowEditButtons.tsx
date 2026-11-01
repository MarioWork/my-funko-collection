import { Pencil, Trash2 } from 'lucide-react';
import IconButton from '@components/IconButton';
import { DISABLED_REASONS, firstReason, reasonWhen } from '@utils/disabledReasonUtils';
import type { ManageRow } from '../types';

type Props = {
  row: ManageRow;
  isBusy: boolean;
  // Set for a read-only user: both stay disabled, saying why.
  readOnlyReason: string | undefined;
  onRename: () => void;
  onDelete: () => void;
};

// A row's Rename and Delete. Delete stays disabled, with the reason, while something still uses the row; both do
// for a read-only user.
function ManageRowEditButtons({ row, isBusy, readOnlyReason, onRename, onDelete }: Props) {
  const isReadOnly = readOnlyReason !== undefined;
  const busyReason = reasonWhen(isBusy, DISABLED_REASONS.WORKING);
  // Read-only first, then busy, then in use.
  const deleteReason = firstReason(readOnlyReason, busyReason, `${row.name} is in use, so it cannot be deleted.`);

  return (
    <>
      <IconButton
        variant="ghost"
        aria-label={`Rename ${row.name}`}
        onClick={onRename}
        disabled={isBusy || isReadOnly}
        disabledReason={firstReason(readOnlyReason, DISABLED_REASONS.WORKING)}
      >
        <Pencil aria-hidden="true" />
      </IconButton>
      <IconButton
        variant="ghost"
        aria-label={row.isDeletable ? `Delete ${row.name}` : `Delete ${row.name} (in use, cannot be deleted)`}
        onClick={onDelete}
        disabled={isBusy || isReadOnly || !row.isDeletable}
        disabledReason={deleteReason}
      >
        <Trash2 aria-hidden="true" />
      </IconButton>
    </>
  );
}

export default ManageRowEditButtons;
