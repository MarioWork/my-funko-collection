import { yupResolver } from '@hookform/resolvers/yup';
import { X } from 'lucide-react';
import type { ApiError, ReviewSubmissionApiModel } from '@app-types/models';
import CancelButton from '@components/CancelButton';
import InlineAlert from '@components/InlineAlert';
import SubmitButton from '@components/SubmitButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { useFormCompat } from '@hooks/useFormCompat';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import {
  REJECT_SUBMISSION_DEFAULT_VALUES,
  rejectSubmissionFormSchema,
  type RejectSubmissionFormValues,
} from '../submissionReviewUtils';
import RejectReasonField from './RejectReasonField';

type Props = {
  submission: ReviewSubmissionApiModel;
  isSaving: boolean;
  failure: ApiError | undefined;
  onReject: (values: RejectSubmissionFormValues) => void;
  onClose: () => void;
};

const FORM_ID = 'reject-submission';
const MEMBER_NOTE =
  'It stays in the member’s own collections, still private. They read your reason, and can fix it and send it again, or delete it.';
// docs/GLOSSARY.md, "Orphan submission".
const ORPHAN_NOTE = 'Its sender was removed, so nobody is left to fix it: rejecting it deletes it.';

// Mounted while open, so every opening starts empty. The reason is required: the member reads it, fixes the funko
// and sends it again, or deletes it; an orphan submission is deleted instead. The list submits it
// (useReviewActions) and closes the dialog once it worked.
function RejectSubmissionDialog({ submission, isSaving, failure, onReject, onClose }: Props) {
  const { control, handleSubmit } = useFormCompat<RejectSubmissionFormValues>({
    defaultValues: REJECT_SUBMISSION_DEFAULT_VALUES,
    resolver: yupResolver(rejectSubmissionFormSchema),
  });

  const onSubmit = handleSubmit(onReject);

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isSaving) onClose();
  };

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {submission.name}?</DialogTitle>
          <DialogDescription>{submission.submittedBy ? MEMBER_NOTE : ORPHAN_NOTE}</DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <RejectReasonField control={control} idPrefix={FORM_ID} />
          {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
        </form>
        <DialogFooter>
          <CancelButton isSubmitting={isSaving} onCancel={onClose} />
          <SubmitButton isSubmitting={isSaving} form={FORM_ID} icon={<X data-icon="inline-start" aria-hidden="true" />}>
            Reject
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RejectSubmissionDialog;
