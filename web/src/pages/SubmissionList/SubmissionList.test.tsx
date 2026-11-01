import { renderRoutes, screen, within } from '@test-utils';
import { SubmissionStatusUtil, UserRoleUtil } from '@app-types/utility';
import { submissionRoutes } from '@application/routes/featureRoutes/submissionRoutes';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';
import { addMockSubmission, setMockUserRole } from '@mocks/mockStore';

const renderSubmissions = () => renderRoutes(submissionRoutes, { initialEntries: [SUBMISSION_ROUTES_PATHS.BASE] });

function rowOf(name: string): HTMLElement {
  const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByRole('link', { name }));

  if (!row) throw new Error(`No row for ${name}`);

  return row;
}

beforeEach(() => {
  setMockUserRole(UserRoleUtil.MEMBER);
});

it('lists what the member sent in, newest first, each with its state in words and a link to it', async () => {
  const approved = addMockSubmission({ name: 'Approved One', status: SubmissionStatusUtil.APPROVED });
  addMockSubmission({ name: 'Rejected One', status: SubmissionStatusUtil.REJECTED });
  addMockSubmission({ name: 'Waiting One' });
  addMockSubmission({ name: 'Someone Else’s', submittedById: MOCK_MEMBER_ID });

  renderSubmissions();

  expect(await screen.findByRole('heading', { level: 1, name: 'Submissions' })).toBeVisible();
  const links = screen.getAllByRole('link').map((link) => link.textContent);
  expect(links).toEqual(['Waiting One', 'Rejected One', 'Approved One']);
  expect(within(rowOf('Waiting One')).getByText('Waiting')).toBeVisible();
  expect(within(rowOf('Rejected One')).getByText('Rejected')).toBeVisible();
  expect(within(rowOf('Approved One')).getByRole('link', { name: 'Approved One' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail(String(approved.id)),
  );
  expect(screen.getByText('3 submissions')).toBeVisible();
});

it('shows an empty state with a way to add one when the member has sent nothing in', async () => {
  renderSubmissions();

  expect(await screen.findByRole('heading', { name: 'Nothing sent in yet' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Add a funko' })).toBeVisible();
});
