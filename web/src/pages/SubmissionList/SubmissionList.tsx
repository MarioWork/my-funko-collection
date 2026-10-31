import { ScanBarcode } from 'lucide-react';
import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import EmptyState from '@components/EmptyState';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import { PAGE_ICONS } from '@utils/navigationUtils';
import SubmissionTable from './components/SubmissionTable';
import type { loader } from './submissionListLoader';
import { describeSubmissionCount } from './submissionListUtils';

const EMPTY_DESCRIPTION =
  'A funko you add that the catalogue does not have yet waits here for an admin. You can use it in your collections meanwhile.';
const PAGE_DESCRIPTION = 'Funkos you sent in. Only you see a waiting one until an admin approves it.';
const PAGE_TITLE = 'Submissions';
const EMPTY_TITLE = 'Nothing sent in yet';

// The funkos the signed-in member sent in, each with where it stands (Waiting, Approved, Rejected, Merged).
function SubmissionList() {
  const { submissionsResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const hasSubmissions = submissionsResponse.data.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.SUBMISSIONS}
        title={PAGE_TITLE}
        description={hasSubmissions ? describeSubmissionCount(submissionsResponse.totalResultNumber) : PAGE_DESCRIPTION}
      />
      {hasSubmissions ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{PAGE_DESCRIPTION}</p>
          <SubmissionTable submissions={submissionsResponse.data} />
        </div>
      ) : (
        <EmptyState pose="waiting" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION}>
          <LinkButton to={ADD_ROUTES_PATHS.BASE}>
            <ScanBarcode data-icon="inline-start" aria-hidden="true" />
            Add a funko
          </LinkButton>
        </EmptyState>
      )}
    </div>
  );
}

export default SubmissionList;
