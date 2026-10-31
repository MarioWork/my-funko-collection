import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import ConfirmDialog from '@components/ConfirmDialog';
import ExportMenu from '@components/ExportMenu';
import exportService from '@services/exportService/exportService';
import InlineAlert from '@components/InlineAlert';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData, isSamePayload } from '@utils/formDataUtils';
import ManageForm, { type ManageEntityFormData, type ManageFormValues } from '@components/ManageForm';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import type { ManageRow } from '../types';
import ManageRowEditButtons from './ManageRowEditButtons';
import { cn } from '@utils/classNameUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';

type Props = {
  row: ManageRow;
  rowPath: string;
  hasNotes: boolean;
  noun: string;
  canEdit: boolean;
};

const SUCCESS_MESSAGE_MAP: Record<string, (name: string) => string> = {
  [HttpVerbsUtil.PATCH]: (name) => `Saved ${name}`,
  [HttpVerbsUtil.DELETE]: (name) => `Deleted ${name}`,
};

// View mode: name, notes, what it is attached to, export its funkos, rename and delete (only when `canEdit`).
// Rename swaps the row for the inline form.
function ManageRowItem({ row, rowPath, hasNotes, noun, canEdit }: Props) {
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

  // Editing and viewing are keyed apart, so switching mounts a fresh row and it fades in rather than snapping.
  if (isEditing) {
    return (
      <li key="edit" className={cn('rounded-xl border bg-card p-4', FADE_IN_CLASS, 'motion-safe:zoom-in-[0.98]')}>
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
    <li key="view" className={cn('flex flex-col gap-2 rounded-xl border bg-card p-3 pl-4', FADE_IN_CLASS)}>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{row.name}</span>
          {row.notes ? <span className="truncate text-sm text-muted-foreground">{row.notes}</span> : null}
          <span className="text-xs text-muted-foreground">{row.meta}</span>
        </div>
        <ExportMenu
          label={`Export ${row.name}`}
          hrefFor={(format) => exportService.getFunkosExportUrl(format, row.exportScope, row.id)}
          disabledReason={row.exportDisabledReason}
        />
        {canEdit ? (
          <ManageRowEditButtons
            row={row}
            isBusy={isBusy}
            onRename={() => setIsEditing(true)}
            onDelete={() => setIsDeleteOpen(true)}
          />
        ) : null}
      </div>
      {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
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
