import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ConfirmDialog from '@components/ConfirmDialog';
import IconButton from '@components/IconButton';
import InlineAlert from '@components/InlineAlert';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import type { ManageEntityFormData, ManageFormValues, ManageRow } from '../manageListUtils';
import ManageForm from './ManageForm';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  row: ManageRow;
  rowPath: string;
  hasNotes: boolean;
  noun: string;
};

const SUCCESS_MESSAGE_MAP: Record<string, (name: string) => string> = {
  [HttpVerbsUtil.PATCH]: (name) => `Saved ${name}`,
  [HttpVerbsUtil.DELETE]: (name) => `Deleted ${name}`,
};

// View mode: name, notes, what it is attached to, rename and delete. Rename swaps the row for the inline form.
function ManageRowItem({ row, rowPath, hasNotes, noun }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [seenData, setSeenData] = useState(fetcher.data);
  const isBusy = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  // A saved rename closes the form. Derived during render from the fetcher's new answer, no effect needed.
  if (fetcher.data !== seenData) {
    setSeenData(fetcher.data);
    if (fetcher.data?.success && fetcher.formMethod === HttpVerbsUtil.PATCH) setIsEditing(false);
  }

  const save = (values: ManageFormValues) => {
    const saved = { name: row.name, notes: row.notes ?? '' };
    const edited = { name: values.name, notes: values.notes ?? '' };

    // Nothing to save: just leave the rename.
    if (isSamePayload(saved, edited)) {
      setIsEditing(false);

      return;
    }

    const payload: ManageEntityFormData = { entity: values };

    void fetcher.submit(createFormData(payload), { method: HttpVerbsUtil.PATCH, action: rowPath });
  };

  const remove = () => {
    setIsDeleteOpen(false);
    void fetcher.submit(null, { method: HttpVerbsUtil.DELETE, action: rowPath });
  };

  useActionToast(fetcher, {
    successMessage: () =>
      (SUCCESS_MESSAGE_MAP[fetcher.formMethod ?? ''] ?? SUCCESS_MESSAGE_MAP[HttpVerbsUtil.PATCH])(row.name),
  });

  if (isEditing) {
    return (
      <li className="rounded-xl border bg-card p-4">
        <ManageForm
          idPrefix={`${noun}-${row.id}`}
          defaultValues={{ name: row.name, notes: row.notes ?? '' }}
          hasNotes={hasNotes}
          submitLabel="Save"
          isSubmitting={isBusy}
          failure={failure}
          onSubmit={save}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card p-3 pl-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{row.name}</span>
          {row.notes ? <span className="truncate text-sm text-muted-foreground">{row.notes}</span> : null}
          <span className="text-xs text-muted-foreground">{row.meta}</span>
        </div>
        <IconButton
          variant="ghost"
          aria-label={`Rename ${row.name}`}
          onClick={() => setIsEditing(true)}
          disabled={isBusy}
          disabledReason={DISABLED_REASONS.WORKING}
        >
          <Pencil aria-hidden="true" />
        </IconButton>
        <IconButton
          variant="ghost"
          aria-label={row.isDeletable ? `Delete ${row.name}` : `Delete ${row.name} (in use, cannot be deleted)`}
          onClick={() => setIsDeleteOpen(true)}
          disabled={isBusy || !row.isDeletable}
          disabledReason={isBusy ? DISABLED_REASONS.WORKING : `${row.name} is in use, so it cannot be deleted.`}
        >
          <Trash2 aria-hidden="true" />
        </IconButton>
      </div>
      {failure ? (
        <InlineAlert tone="error">{failure.message ?? 'Something went wrong. Please try again.'}</InlineAlert>
      ) : null}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={`Delete ${row.name}?`}
        description={row.deleteDescription}
        confirmLabel="Delete"
        isDestructive
        isPending={isBusy}
        onConfirm={remove}
        onClose={() => setIsDeleteOpen(false)}
      />
    </li>
  );
}

export default ManageRowItem;
