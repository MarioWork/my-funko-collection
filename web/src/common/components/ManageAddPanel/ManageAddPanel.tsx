import { useEffect } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import CancelButton from '@components/CancelButton';
import FormPanel from '@components/FormPanel';
import ManageForm from '@components/ManageList/components/ManageForm';
import {
  EMPTY_MANAGE_VALUES,
  type ManageEntityFormData,
  type ManageFormValues,
} from '@components/ManageList/manageListUtils';
import SubmitButton from '@components/SubmitButton';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData } from '@utils/formDataUtils';

type Props = {
  // "category", "tag": in the title, the ids and the button.
  noun: string;
  description: string;
  hasNotes: boolean;
  // The list route whose action creates the entity.
  addPath: string;
};

type Created = { id: number; name: string };

const BACK = -1;

// "New tag" / "New category": a dialog on desktop, a page on phones. Posts to the list's own action, then goes back
// to the list with a toast.
function ManageAddPanel({ noun, description, hasNotes, addPath }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<Created>>();
  const navigate = useNavigate();
  const formId = `add-${noun}`;
  const isSubmitting = fetcher.state !== 'idle';
  const failure = fetcher.data?.success === false ? fetcher.data.error : undefined;

  const close = () => void navigate(BACK);

  const submit = (values: ManageFormValues) => {
    const payload: ManageEntityFormData = { entity: values };

    void fetcher.submit(createFormData(payload), { method: HttpVerbsUtil.POST, action: addPath });
  };

  useActionToast(fetcher, { successMessage: (data) => `Added ${(data as Created).name}` });

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <FormPanel
      title={`New ${noun}`}
      description={description}
      onClose={close}
      footer={
        <>
          <CancelButton isSubmitting={isSubmitting} onCancel={close} />
          <SubmitButton isSubmitting={isSubmitting} form={formId}>
            Add {noun}
          </SubmitButton>
        </>
      }
    >
      <ManageForm
        formId={formId}
        idPrefix={formId}
        defaultValues={EMPTY_MANAGE_VALUES}
        hasNotes={hasNotes}
        submitLabel={`Add ${noun}`}
        isSubmitting={isSubmitting}
        failure={failure}
        onSubmit={submit}
      />
    </FormPanel>
  );
}

export default ManageAddPanel;
