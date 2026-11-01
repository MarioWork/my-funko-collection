import { render, renderRoutes, screen, userEvent, within } from '@test-utils';
import { SubmissionStatusUtil, UserRoleUtil } from '@app-types/utility';
import { submissionRoutes } from '@application/routes/featureRoutes/submissionRoutes';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Toaster } from '@components/ui/toast';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';
import { addMockSubmission, setMockReadOnly, setMockUserRole } from '@mocks/mockStore';

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

it('shows why a submission was rejected, and sends it again so it waits once more', async () => {
  addMockSubmission({ name: 'Rejected One', status: SubmissionStatusUtil.REJECTED });
  render(<Toaster />);

  renderSubmissions();

  const row = await screen.findByRole('row', { name: /Rejected One/ });
  expect(within(row).getByText('Not a real funko')).toBeVisible();
  await userEvent.click(within(row).getByRole('button', { name: 'Send again' }));

  expect(await within(rowOf('Rejected One')).findByText('Waiting')).toBeVisible();
  expect(within(rowOf('Rejected One')).queryByText('Not a real funko')).not.toBeInTheDocument();
  expect(await screen.findByText('Rejected One sent again')).toBeVisible();
});

it('says so when an admin changed what the member sent in', async () => {
  addMockSubmission({ name: 'Fixed By Admin', changedByAdminAt: '2026-10-02T10:00:00.000Z' });

  renderSubmissions();

  expect(await screen.findByText(/An admin changed this submission/)).toBeVisible();
});

it('says why a rejected submission cannot be sent again while the member waits on the same barcode', async () => {
  addMockSubmission({ name: 'Waiting Twin', barcode: '0889698123456' });
  addMockSubmission({ name: 'Rejected Twin', barcode: '0889698123456', status: SubmissionStatusUtil.REJECTED });

  renderSubmissions();

  const row = await screen.findByRole('row', { name: /Rejected Twin/ });
  await userEvent.click(within(row).getByRole('button', { name: 'Send again' }));

  expect(await within(row).findByRole('alert')).toHaveTextContent('This barcode belongs to another funko');
});

it('keeps Send again disabled for a read-only member', async () => {
  setMockReadOnly();
  addMockSubmission({ name: 'Rejected One', status: SubmissionStatusUtil.REJECTED });

  renderSubmissions();

  const row = await screen.findByRole('row', { name: /Rejected One/ });
  expect(within(row).getByRole('button', { name: 'Send again' })).toHaveAccessibleDescription(
    /Your account is read-only/,
  );
});

it('drops the admin-changed note once the member sends a rejected submission again', async () => {
  addMockSubmission({
    name: 'Changed One',
    status: SubmissionStatusUtil.REJECTED,
    changedByAdminAt: '2026-10-02T10:00:00.000Z',
  });

  renderSubmissions();

  const row = await screen.findByRole('row', { name: /Changed One/ });
  expect(within(row).getByText(/An admin changed this submission/)).toBeVisible();
  await userEvent.click(within(row).getByRole('button', { name: 'Send again' }));

  expect(await within(rowOf('Changed One')).findByText('Waiting')).toBeVisible();
  expect(within(rowOf('Changed One')).queryByText(/An admin changed this submission/)).not.toBeInTheDocument();
});
