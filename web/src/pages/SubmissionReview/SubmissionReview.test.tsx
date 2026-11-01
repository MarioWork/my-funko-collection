import { render, renderRoutes, screen, userEvent, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { submissionRoutes } from '@application/routes/featureRoutes/submissionRoutes';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Toaster } from '@components/ui/toast';
import RouteError from '@pages/Error/RouteError';
import { addMockSubmission, mockStore, setMockReadOnly, setMockUserRole } from '@mocks/mockStore';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';

// The seed's other members' submissions: two waiting (luke's Thanos is maybe a double of the catalogue's #78) and
// luke's rejected Bluey.
const LUKES_THANOS = 'Thanos (Infinity Gauntlet)';
const HANS_MANDO = 'Mandalorian with Grogu';
const LUKES_BLUEY = 'Bluey';
// The seed's Spider-Man carries this barcode.
const CATALOGUE_BARCODE = '889698624008';

// The page under the route error boundary, as in the app, so a member's refusal shows its page.
const routes = [{ errorElement: <RouteError />, children: submissionRoutes }];

function renderReview(search = '') {
  render(<Toaster />);
  renderRoutes(routes, { initialEntries: [`${SUBMISSION_ROUTES_PATHS.REVIEW}${search}`] });
}

async function findRow(name: string): Promise<HTMLElement> {
  return screen.findByRole('row', { name: new RegExp(name.replace(/[()]/g, '\\$&')) });
}

it('lists every member’s waiting submission, oldest first, with who sent it and a maybe-double', async () => {
  renderReview();

  expect(await screen.findByRole('heading', { level: 1, name: 'Submissions' })).toBeVisible();
  const names = screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('link')[0]?.textContent);
  expect(names).toEqual([LUKES_THANOS, HANS_MANDO]);
  const thanos = await findRow(LUKES_THANOS);
  expect(within(thanos).getByText(/from luke/)).toBeVisible();
  expect(within(thanos).getByText('Maybe a double')).toBeVisible();
  expect(within(thanos).getAllByRole('link', { name: '#78 Thanos' })[0]).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail('5'),
  );
  expect(within(await findRow(HANS_MANDO)).queryByText('Maybe a double')).not.toBeInTheDocument();
  expect(screen.getByText('2 waiting')).toBeVisible();
});

it('names a removed user as the sender when the member who sent it in was deleted', async () => {
  addMockSubmission({ name: 'Orphan', submittedById: null });

  renderReview();

  expect(within(await findRow('Orphan')).getByText(/from Removed user/)).toBeVisible();
});

it('approves a submission: it leaves the Waiting tab and shows as approved under Done', async () => {
  renderReview();

  await userEvent.click(within(await findRow(HANS_MANDO)).getByRole('button', { name: 'Approve' }));

  expect(await screen.findByText(`${HANS_MANDO} approved`)).toBeVisible();
  expect(screen.queryByRole('row', { name: new RegExp(HANS_MANDO) })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Done' }));
  expect(within(await findRow(HANS_MANDO)).getByText('Approved')).toBeVisible();
});

it('says why an approval is refused, with a link to the catalogue funko, when the barcode is taken', async () => {
  const clash = addMockSubmission({ name: 'Clash', barcode: CATALOGUE_BARCODE, submittedById: MOCK_MEMBER_ID });

  renderReview();

  const row = await findRow('Clash');
  await userEvent.click(within(row).getByRole('button', { name: 'Approve' }));

  expect(await within(row).findByRole('alert')).toHaveTextContent('barcode belongs to another funko in the catalogue');
  expect(within(row).getByRole('link', { name: 'Open the catalogue’s funko' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail('1'),
  );
  expect(mockStore.funkos.find((funko) => funko.id === clash.id)?.status).toBe('WAITING');
});

it('rejects a submission only with a reason, which then shows under Done', async () => {
  renderReview();

  await userEvent.click(within(await findRow(HANS_MANDO)).getByRole('button', { name: 'Reject' }));
  const dialog = await screen.findByRole('dialog', { name: `Reject ${HANS_MANDO}?` });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
  expect(await within(dialog).findByText('Say why, so the member can fix it')).toBeVisible();
  await userEvent.type(within(dialog).getByLabelText('Why?'), 'Blurry photo');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

  expect(await screen.findByText(`${HANS_MANDO} rejected`)).toBeVisible();
  expect(screen.queryByRole('dialog', { name: `Reject ${HANS_MANDO}?` })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Done' }));
  const row = await findRow(HANS_MANDO);
  expect(within(row).getByText('Rejected')).toBeVisible();
  expect(within(row).getByText('Blurry photo')).toBeVisible();
});

it('lists what became of the reviewed submissions under Done, with the reason the member read', async () => {
  renderReview('?state=DONE');

  const row = await findRow(LUKES_BLUEY);
  expect(within(row).getByText('Rejected')).toBeVisible();
  expect(within(row).getByText(/shop listing/)).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Done', selected: true })).toBeVisible();
});

it('says the page is for admins when a member opens it', async () => {
  setMockUserRole(UserRoleUtil.MEMBER);

  renderReview();

  expect(await screen.findByRole('heading', { level: 1, name: 'This page is for admins' })).toBeVisible();
});

it('deletes an orphan submission on reject, saying so first, so it shows under neither tab', async () => {
  const orphan = addMockSubmission({ name: 'Orphan', submittedById: null });
  renderReview();

  await userEvent.click(within(await findRow('Orphan')).getByRole('button', { name: 'Reject' }));
  const dialog = await screen.findByRole('dialog', { name: 'Reject Orphan?' });
  expect(within(dialog).getByText(/rejecting it deletes it/)).toBeVisible();
  await userEvent.type(within(dialog).getByLabelText('Why?'), 'Nobody to fix it');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

  expect(await screen.findByText('Orphan rejected')).toBeVisible();
  expect(screen.queryByRole('row', { name: /Orphan/ })).not.toBeInTheDocument();
  expect(mockStore.funkos.some((funko) => funko.id === orphan.id)).toBe(false);
});

it('shows a read-only admin the submissions with Approve and Reject disabled', async () => {
  setMockReadOnly();
  renderReview();

  const row = await findRow(HANS_MANDO);

  expect(within(row).getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-disabled', 'true');
  expect(within(row).getByRole('button', { name: 'Reject' })).toHaveAccessibleDescription(/Your account is read-only/);
});
