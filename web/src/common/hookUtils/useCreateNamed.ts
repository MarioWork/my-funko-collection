import { useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { NamedApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { createFormData } from '@utils/formDataUtils';

type Options = {
  // The list route whose action creates the entity (CATEGORY_ROUTES_PATHS.BASE, TAG_ROUTES_PATHS.BASE, …).
  actionPath: string;
  // Called once with what was created, so the picker can select it right away.
  onCreated: (created: NamedApiModel) => void;
};

const CREATE_FAILED_MESSAGE = 'Could not create it.';

// Creates a category, tag or series by name from inside another form, through that list's own route action (so
// every loader on the page reloads and the new option shows up). The caller selects it in onCreated.
export function useCreateNamed({ actionPath, onCreated }: Options) {
  const fetcher = useFetcher<JSONResponseUtil<NamedApiModel>>();
  const created = fetcher.data?.success ? fetcher.data.data : undefined;

  // Handing the result to the parent's state is a side effect of a finished request, not of rendering.
  useEffect(() => {
    if (fetcher.state === 'idle' && created) onCreated(created);
    // Fires once per created entity: `created` is a new object for each successful submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [created, fetcher.state]);

  const create = (name: string) =>
    void fetcher.submit(createFormData({ entity: { name: name.trim(), notes: '' } }), {
      method: HttpVerbsUtil.POST,
      action: actionPath,
    });

  return {
    create,
    isCreating: fetcher.state !== 'idle',
    errorMessage: fetcher.data?.success === false ? (fetcher.data.error?.message ?? CREATE_FAILED_MESSAGE) : undefined,
  };
}
