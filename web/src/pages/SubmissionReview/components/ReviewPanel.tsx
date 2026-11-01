import type { ReviewSubmissionApiModel } from '@app-types/models';
import EmptyState from '@components/EmptyState';
import { useCloseOnSuccess } from '@hooks/useCloseOnSuccess';
import type { SubmissionApiReviewStates } from '@services/submissionService/submissionService';
import { useReviewActions } from '../hooks/useReviewActions';
import { ReviewActionsContext } from '../ReviewActionsContext';
import { REVIEW_EMPTY_COPY } from '../submissionReviewUtils';
import RejectSubmissionDialog from './RejectSubmissionDialog';
import ReviewTable from './ReviewTable';

type Props = {
  submissions: ReviewSubmissionApiModel[];
  state: SubmissionApiReviewStates;
};

// One tab's content: its submissions, or a word on why there are none. It owns approve and reject (and the reject
// dialog), so their toast and errors outlive the row they came from. Merge opens its own routed dialog.
function ReviewPanel({ submissions, state }: Props) {
  const actions = useReviewActions();
  const { rejecting } = actions;
  const hasSubmissions = submissions.length > 0;
  const { title, description } = REVIEW_EMPTY_COPY[state];

  useCloseOnSuccess(actions.fetcher, actions.closeDialogs);

  return (
    <ReviewActionsContext value={actions}>
      {hasSubmissions ? (
        <div className="rounded-xl border bg-card p-4">
          <ReviewTable submissions={submissions} state={state} />
        </div>
      ) : (
        <EmptyState pose="waiting" title={title} description={description} />
      )}
      {rejecting ? (
        <RejectSubmissionDialog
          submission={rejecting}
          isSaving={actions.isBusy}
          failure={actions.rejectFailure}
          onReject={(values) => actions.reject(rejecting, values)}
          onClose={actions.closeDialogs}
        />
      ) : null}
    </ReviewActionsContext>
  );
}

export default ReviewPanel;
