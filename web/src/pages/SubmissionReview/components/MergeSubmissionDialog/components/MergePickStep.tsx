import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { FunkoId } from '@app-types/models';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
import { Button } from '@components/ui/button';
import { DialogFooter } from '@components/ui/dialog';
import { useFormCompat } from '@hooks/useFormCompat';
import { useMergeTargets } from '../hooks/useMergeTargets';
import { mergePickFormSchema, type MergePickFormValues, type MergeTarget } from '../mergeSubmissionDialogUtils';
import MergeSearchField from './MergeSearchField';
import MergeTargetField from './MergeTargetField';

type Props = {
  submissionId: FunkoId;
  onCancel: () => void;
};

const FORM_ID = 'merge-pick';

// The first step: which catalogue funko the submission is the same as, from its maybe-doubles (the first one picked)
// or a search of the catalogue. Next opens the side-by-side step for it (its id goes in the URL).
function MergePickStep({ submissionId, onCancel }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pickedTarget, setPickedTarget] = useState<MergeTarget>();
  const { targets, isSearching } = useMergeTargets(submissionId, query, pickedTarget);
  const { control, handleSubmit } = useFormCompat<MergePickFormValues>({
    defaultValues: { targetFunkoId: targets[0] ? String(targets[0].id) : '' },
    resolver: yupResolver(mergePickFormSchema),
  });

  const onSubmit = handleSubmit(({ targetFunkoId }) => {
    void navigate(SUBMISSION_ROUTES_PATHS.mergeInto(String(submissionId), targetFunkoId));
  });

  return (
    <>
      <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
        <MergeSearchField value={query} onChange={setQuery} />
        <MergeTargetField
          control={control}
          idPrefix={FORM_ID}
          targets={targets}
          isSearching={isSearching}
          onPick={setPickedTarget}
        />
      </form>
      <DialogFooter>
        <CancelButton isSubmitting={false} onCancel={onCancel} />
        <Button type="submit" form={FORM_ID}>
          Next
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DialogFooter>
    </>
  );
}

export default MergePickStep;
