import { Pencil, Trash2 } from 'lucide-react';
import IconButton from '@components/IconButton';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import type { ManageRow } from '../types';

type Props = {
  row: ManageRow;
  isBusy: boolean;
  onRename: () => void;
  onDelete: () => void;
};

// A row's Rename and Delete. Delete stays disabled, with the reason, while something still uses the row.
function ManageRowEditButtons({ row, isBusy, onRename, onDelete }: Props) {
  return (
    <>
      <IconButton
        variant="ghost"
        aria-label={`Rename ${row.name}`}
        onClick={onRename}
        disabled={isBusy}
        disabledReason={DISABLED_REASONS.WORKING}
      >
        <Pencil aria-hidden="true" />
      </IconButton>
      <IconButton
        variant="ghost"
        aria-label={row.isDeletable ? `Delete ${row.name}` : `Delete ${row.name} (in use, cannot be deleted)`}
        onClick={onDelete}
        disabled={isBusy || !row.isDeletable}
        disabledReason={isBusy ? DISABLED_REASONS.WORKING : `${row.name} is in use, so it cannot be deleted.`}
      >
        <Trash2 aria-hidden="true" />
      </IconButton>
    </>
  );
}

export default ManageRowEditButtons;
