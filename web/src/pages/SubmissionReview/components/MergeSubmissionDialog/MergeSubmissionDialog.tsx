import { useLoaderData, useNavigate } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import MergeCompareStep from './components/MergeCompareStep';
import MergePickStep from './components/MergePickStep';
import { useMergeSubmission } from './hooks/useMergeSubmission';
import type { loader } from './mergeSubmissionDialogLoader';

const MEMBER_NOTE =
  'The member’s items move to the funko you pick. Where they already have it in the same collection, the two become one: quantities added, notes and tags joined.';
// docs/GLOSSARY.md, "Orphan submission".
const ORPHAN_NOTE = 'Its sender was removed, so no items move: it is only marked as merged.';

type HeaderProps = {
  name: string;
  hasSender: boolean;
};

// What merging this submission does: an orphan submission has no items to move.
function MergeDialogHeader({ name, hasSender }: HeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>Merge {name}?</DialogTitle>
      <DialogDescription>{hasSender ? MEMBER_NOTE : ORPHAN_NOTE}</DialogDescription>
    </DialogHeader>
  );
}

// Routed over the review page (/submissions/review/:funkoId/merge): one flow for both ways in. Without `?into=` it
// picks the catalogue funko the submission is the same as; with it, it compares the two side by side and the admin
// picks what the catalogue funko keeps. Closing goes back to the list, which the merge reloads.
function MergeSubmissionDialog() {
  const { submission, comparison } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const navigate = useNavigate();
  const close = () => void navigate(SUBMISSION_ROUTES_PATHS.REVIEW);
  const { isSaving, failure, merge } = useMergeSubmission(submission, close);

  const changeOpen = (isOpen: boolean) => {
    if (!isOpen && !isSaving) close();
  };

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <MergeDialogHeader name={submission.name} hasSender={submission.submittedBy !== null} />
        {comparison ? (
          <MergeCompareStep
            key={comparison.original.id}
            submission={submission}
            comparison={comparison}
            isSaving={isSaving}
            failure={failure}
            onMerge={merge}
            onCancel={close}
          />
        ) : (
          <MergePickStep submissionId={submission.id} onCancel={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MergeSubmissionDialog;
