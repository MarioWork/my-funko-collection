import { yupResolver } from '@hookform/resolvers/yup';
import { Merge } from 'lucide-react';
import { useState } from 'react';
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
import { useMergeTargets } from '../hooks/useMergeTargets';
import { mergeSubmissionFormSchema, type MergeSubmissionFormValues, type MergeTarget } from '../submissionReviewUtils';
import MergeSearchField from './MergeSearchField';
import MergeTargetField from './MergeTargetField';

type Props = {
  submission: ReviewSubmissionApiModel;
  isSaving: boolean;
  failure: ApiError | undefined;
  onMerge: (values: MergeSubmissionFormValues) => void;
  onClose: () => void;
};

const FORM_ID = 'merge-submission';
const MEMBER_NOTE =
  'The member’s items move to the funko you pick. Where they already have it in the same collection, the two become one: quantities added, notes and tags joined.';
// docs/GLOSSARY.md, "Orphan submission".
const ORPHAN_NOTE = 'Its sender was removed, so no items move: it is only marked as merged.';

// Mounted while open, so every opening starts fresh, with the first maybe-double already picked. The list submits it
// (useReviewActions) and closes the dialog once it worked.
function MergeSubmissionDialog({ submission, isSaving, failure, onMerge, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [pickedTarget, setPickedTarget] = useState<MergeTarget>();
  const { targets, isSearching } = useMergeTargets(submission, query, pickedTarget);
  const { control, handleSubmit } = useFormCompat<MergeSubmissionFormValues>({
    defaultValues: { targetFunkoId: targets[0] ? String(targets[0].id) : '' },
    resolver: yupResolver(mergeSubmissionFormSchema),
  });

  const onSubmit = handleSubmit(onMerge);

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isSaving) onClose();
  };

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge {submission.name}?</DialogTitle>
          <DialogDescription>{submission.submittedBy ? MEMBER_NOTE : ORPHAN_NOTE}</DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <MergeSearchField value={query} onChange={setQuery} />
          <MergeTargetField
            control={control}
            idPrefix={FORM_ID}
            targets={targets}
            isSearching={isSearching}
            onPick={setPickedTarget}
          />
          {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
        </form>
        <DialogFooter>
          <CancelButton isSubmitting={isSaving} onCancel={onClose} />
          <SubmitButton
            isSubmitting={isSaving}
            form={FORM_ID}
            icon={<Merge data-icon="inline-start" aria-hidden="true" />}
          >
            Merge
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MergeSubmissionDialog;
