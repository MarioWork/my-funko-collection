import { useEffect } from 'react';
import type { FetcherWithComponents } from 'react-router';
import type { JSONResponseUtil } from '@app-types/utility';
import { toast } from '@components/ui/toast';

type UndoAction = {
  label?: string;
  onUndo: () => void;
};

type Options = {
  successMessage: string | ((data: unknown) => string);
  undo?: UndoAction;
};

const UNDO_TOAST_MS = 7000;

// After a fetcher's write settles with success, one past-tense toast, with a single Undo when the write is safe to
// reverse. Errors are never toasted: the component shows them inline next to the form.
export function useActionToast(fetcher: FetcherWithComponents<JSONResponseUtil<unknown>>, options: Options): void {
  const { data, state } = fetcher;
  const { successMessage, undo } = options;

  useEffect(() => {
    const isSettledSuccess = state === 'idle' && data?.success === true;

    if (!isSettledSuccess) return;

    const title = typeof successMessage === 'function' ? successMessage(data.data) : successMessage;

    toast.add({
      title,
      type: 'success',
      timeout: UNDO_TOAST_MS,
      actionProps: undo ? { children: undo.label ?? 'Undo', onClick: undo.onUndo } : undefined,
    });
    // Fires once per settled submission: `data` is a new object each time the fetcher resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, state]);
}
