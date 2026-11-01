import { Pencil, Trash2 } from 'lucide-react';
import IconButton from '@components/IconButton';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import type { ManageRow } from '../types';

type Props = {
  row: ManageRow;
  isBusy: boolean;
  // Set for a read-only user: both stay disabled, saying why.
  readOnlyReason: string | undefined;
  onRename: () => void;
  onDelete: () => void;
};

// Why Delete is disabled: read-only first, then busy, then in use.
function deleteDisabledReason(row: ManageRow, isBusy: boolean, readOnlyReason: string | undefined): string {
  if (readOnlyReason) return readOnlyReason;

  if (isBusy) return DISABLED_REASONS.WORKING;

  return `${row.name} is in use, so it cannot be deleted.`;
}

// A row's Rename and Delete. Delete stays disabled, with the reason, while something still uses the row; both do
// for a read-only user.
function ManageRowEditButtons({ row, isBusy, readOnlyReason, onRename, onDelete }: Props) {
  const isReadOnly = readOnlyReason !== undefined;

  return (
    <>
      <IconButton
        variant="ghost"
        aria-label={`Rename ${row.name}`}
        onClick={onRename}
        disabled={isBusy || isReadOnly}
        disabledReason={readOnlyReason ?? DISABLED_REASONS.WORKING}
      >
        <Pencil aria-hidden="true" />
      </IconButton>
      <IconButton
        variant="ghost"
        aria-label={row.isDeletable ? `Delete ${row.name}` : `Delete ${row.name} (in use, cannot be deleted)`}
        onClick={onDelete}
        disabled={isBusy || isReadOnly || !row.isDeletable}
        disabledReason={deleteDisabledReason(row, isBusy, readOnlyReason)}
      >
        <Trash2 aria-hidden="true" />
      </IconButton>
    </>
  );
}

export default ManageRowEditButtons;
