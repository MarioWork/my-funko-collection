import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData } from '@utils/formDataUtils';
import { EMPTY_MANAGE_VALUES, type ManageEntityFormData, type ManageFormValues } from '../manageListUtils';
import ManageForm from './ManageForm';

type Props = {
  addPath: string;
  hasNotes: boolean;
  noun: string;
};

type Created = { id: number; name: string };

const NEW_KEY = 'new';

// The add form at the top of the list; after a successful add it remounts empty (keyed on the created id).
function ManageAddForm({ addPath, hasNotes, noun }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<Created>>();
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;
  const createdId = fetcher.data?.success ? fetcher.data.data?.id : undefined;

  const submit = (values: ManageFormValues) => {
    const payload: ManageEntityFormData = { entity: values };

    void fetcher.submit(createFormData(payload), { method: HttpVerbsUtil.POST, action: addPath });
  };

  useActionToast(fetcher, { successMessage: (data) => `Added ${(data as Created).name}` });

  return (
    <section aria-label={`Add a ${noun}`} className="rounded-xl border bg-card p-4">
      <ManageForm
        key={createdId ?? NEW_KEY}
        idPrefix={`add-${noun}`}
        defaultValues={EMPTY_MANAGE_VALUES}
        hasNotes={hasNotes}
        submitLabel={`Add ${noun}`}
        isSubmitting={isSubmitting}
        failure={failure}
        onSubmit={submit}
      />
    </section>
  );
}

export default ManageAddForm;
