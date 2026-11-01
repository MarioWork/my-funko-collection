import PageHeader from '@components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { PAGE_ICONS } from '@utils/navigationUtils';
import ReviewPanel from './components/ReviewPanel';
import { useSubmissionReview } from './hooks/useSubmissionReview';
import { describeReviewCount, isReviewState, REVIEW_TABS } from './submissionReviewUtils';

const PAGE_TITLE = 'Submissions';
const TABS_LABEL = 'Which submissions';

// Admins only: every member's submissions, Waiting (approve or reject each) and Done (what became of them).
function SubmissionReview() {
  const { submissions, totalResultNumber, state, setState } = useSubmissionReview();

  const changeTab = (value: unknown) => {
    if (typeof value === 'string' && isReviewState(value)) setState(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.SUBMISSIONS}
        title={PAGE_TITLE}
        description={describeReviewCount(totalResultNumber, state)}
      />
      <Tabs value={state} onValueChange={changeTab}>
        <TabsList aria-label={TABS_LABEL}>
          {REVIEW_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="min-w-24">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={state}>
          <ReviewPanel submissions={submissions} state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SubmissionReview;
