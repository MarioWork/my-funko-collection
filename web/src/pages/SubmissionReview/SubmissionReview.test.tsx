import { http, HttpResponse } from 'msw/http';
import { render, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { UserRoleUtil } from '@app-types/utility';
import { submissionRoutes } from '@application/routes/featureRoutes/submissionRoutes';
import { FUNKO_ROUTES_PATHS, SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Toaster } from '@components/ui/toast';
import RouteError from '@pages/Error/RouteError';
import { addMockSubmission, mockStore, setMockReadOnly, setMockUserRole } from '@mocks/mockStore';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';
import { server, TEST_BASE_API_URL } from '@mocks/server';

// The seed's other members' submissions: two waiting (luke's Thanos is maybe a double of the catalogue's #78),
// luke's rejected Bluey and han's Baby Yoda, merged into the catalogue's Grogu.
const LUKES_THANOS = 'Thanos (Infinity Gauntlet)';
const HANS_MANDO = 'Mandalorian with Grogu';
const LUKES_BLUEY = 'Bluey';
const HANS_BABY_YODA = 'Baby Yoda';
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
  expect(names).toEqual([LUKES_THANOS, 'Totoro', HANS_MANDO, 'BB-8', 'Rey with Lightsaber']);
  const thanos = await findRow(LUKES_THANOS);
  expect(within(thanos).getByText(/from luke/)).toBeVisible();
  expect(within(thanos).getByText('Maybe a double')).toBeVisible();
  expect(within(thanos).getByRole('link', { name: '#78 Thanos' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail('5'),
  );
  expect(within(thanos).getByRole('link', { name: '#78 Thanos (Chase)' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail('6'),
  );
  expect(within(await findRow(HANS_MANDO)).queryByText('Maybe a double')).not.toBeInTheDocument();
  expect(within(await findRow('Totoro')).getByText(/from Removed user/)).toBeVisible();
  expect(screen.getByText('5 waiting')).toBeVisible();
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

// A funko's images as the mock store holds them, in order, for checking what a merge kept.
function imageIdsOf(funkoId: number): number[] {
  return mockStore.images
    .filter((image) => image.funkoId === funkoId)
    .sort((first, second) => first.position - second.position)
    .map((image) => image.id);
}

it('merges into a picked maybe-double, keeping the fields and images the admin picks side by side', async () => {
  renderReview();
  const thanos = mockStore.funkos.find((funko) => funko.name === LUKES_THANOS);
  const [originalFirst, originalSecond] = imageIdsOf(5);
  const [sentImage] = imageIdsOf(thanos?.id ?? 0);

  await userEvent.click(within(await findRow(LUKES_THANOS)).getByRole('link', { name: 'Merge' }));
  const dialog = await screen.findByRole('dialog', { name: `Merge ${LUKES_THANOS}?` });
  expect(within(dialog).getByRole('radio', { name: /^#78 Thanos\s*Maybe a double/ })).toBeChecked();
  expect(within(dialog).getByRole('radio', { name: /^#78 Thanos \(Chase\)/ })).not.toBeChecked();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));

  const name = await within(dialog).findByRole('radiogroup', { name: 'Name' });
  expect(within(name).getByRole('radio', { name: 'Original Thanos' })).toBeChecked();
  expect(within(dialog).queryByRole('radiogroup', { name: 'Number' })).not.toBeInTheDocument();
  expect(within(dialog).getByText('Same on both')).toBeVisible();
  expect(within(dialog).getByRole('checkbox', { name: 'Original image 1' })).toBeChecked();
  expect(within(dialog).getByRole('checkbox', { name: 'Submission image 1' })).not.toBeChecked();
  await userEvent.click(within(name).getByRole('radio', { name: `Submission ${LUKES_THANOS}` }));
  await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Original image 2' }));
  await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Submission image 1' }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Merge' }));

  expect(await screen.findByText(`${LUKES_THANOS} merged`)).toBeVisible();
  await waitFor(() => expect(screen.queryByRole('dialog', { name: `Merge ${LUKES_THANOS}?` })).not.toBeInTheDocument());
  expect(mockStore.funkos.find((funko) => funko.id === 5)).toMatchObject({ name: LUKES_THANOS, number: '78' });
  expect(imageIdsOf(5)).toEqual([originalFirst, sentImage]);
  expect(mockStore.images.some((image) => image.id === originalSecond)).toBe(false);
  await userEvent.click(screen.getByRole('tab', { name: 'Done' }));
  const row = await findRow(LUKES_THANOS);
  expect(within(row).getByText('Merged')).toBeVisible();
});

it('opens straight on the side-by-side view when the review found one catalogue double', async () => {
  addMockSubmission({ name: 'Spidey', number: '999', barcode: CATALOGUE_BARCODE, submittedById: MOCK_MEMBER_ID });
  renderReview();

  await userEvent.click(within(await findRow('Spidey')).getByRole('link', { name: 'Merge' }));

  const dialog = await screen.findByRole('dialog', { name: 'Merge Spidey?' });
  expect(await within(dialog).findByText('#03 Spider-Man')).toBeVisible();
  expect(within(dialog).getByRole('radiogroup', { name: 'Name' })).toBeVisible();
  expect(within(dialog).queryByRole('radiogroup', { name: 'Barcode' })).not.toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('link', { name: 'Pick another funko' }));
  expect(await within(dialog).findByRole('searchbox', { name: 'Search the catalogue' })).toBeVisible();
});

it('offers a barcode another catalogue funko holds disabled, saying why', async () => {
  addMockSubmission({ name: 'Mad Titan', number: '78', barcode: CATALOGUE_BARCODE, submittedById: MOCK_MEMBER_ID });
  renderReview();

  // Luke's Thanos lists this one as a waiting maybe-double too; the newest submission is the last row.
  const row = (await screen.findAllByRole('row', { name: /Mad Titan/ })).at(-1);
  await userEvent.click(within(row ?? document.body).getByRole('link', { name: 'Merge' }));
  const dialog = await screen.findByRole('dialog', { name: 'Merge Mad Titan?' });
  await userEvent.click(within(dialog).getByRole('radio', { name: /^#78 Thanos\s*Maybe a double/ }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));

  const barcode = await within(dialog).findByRole('radiogroup', { name: 'Barcode' });
  const takenOption = within(barcode).getByRole('radio', { name: /^Submission/ });
  expect(takenOption).toHaveAttribute('aria-disabled', 'true');
  expect(takenOption).toHaveAccessibleDescription('This barcode belongs to #03 Spider-Man in the catalogue');
  expect(within(barcode).getByRole('radio', { name: 'Original None' })).toBeChecked();
});

it('marks a submission with no maybe-double as a double of a funko found by searching the catalogue', async () => {
  renderReview();

  await userEvent.click(within(await findRow(HANS_MANDO)).getByRole('link', { name: 'This is a double of…' }));
  const dialog = await screen.findByRole('dialog', { name: `Merge ${HANS_MANDO}?` });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  expect(await within(dialog).findByText('Pick the funko it is the same as')).toBeVisible();
  await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search the catalogue' }), 'Grogu');
  await userEvent.click(await within(dialog).findByRole('radio', { name: /#368 Grogu/ }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByRole('radiogroup', { name: 'Name' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Merge' }));

  expect(await screen.findByText(`${HANS_MANDO} merged`)).toBeVisible();
  const merged = mockStore.funkos.find((funko) => funko.name === HANS_MANDO);
  expect(merged).toMatchObject({ status: 'MERGED', mergedIntoId: 16 });
  expect(mockStore.funkos.find((funko) => funko.id === 16)).toMatchObject({ name: 'Grogu' });
});

it('shows the API’s words in the dialog when the merge is refused', async () => {
  server.use(
    http.post(`${TEST_BASE_API_URL}/submissions/:funkoId/merge`, () =>
      HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'A funko holds at most 10 images' }, { status: 400 }),
    ),
  );
  renderReview();

  await userEvent.click(within(await findRow(LUKES_THANOS)).getByRole('link', { name: 'Merge' }));
  const dialog = await screen.findByRole('dialog', { name: `Merge ${LUKES_THANOS}?` });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
  await within(dialog).findByRole('radiogroup', { name: 'Name' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Merge' }));

  expect(await within(dialog).findByText('A funko holds at most 10 images')).toBeVisible();
});

it('lists a merged submission under Done with a link to the funko it went into', async () => {
  renderReview('?state=DONE');

  const row = await findRow(HANS_BABY_YODA);
  expect(within(row).getByText('Merged')).toBeVisible();
  expect(within(row).getByRole('link', { name: 'Grogu' })).toHaveAttribute('href', FUNKO_ROUTES_PATHS.detail('16'));
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

it('shows a read-only admin the submissions with Approve, Merge and Reject disabled', async () => {
  setMockReadOnly();
  renderReview();

  const row = await findRow(HANS_MANDO);

  expect(within(row).getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-disabled', 'true');
  expect(within(row).getByRole('button', { name: 'This is a double of…' })).toHaveAttribute('aria-disabled', 'true');
  expect(within(row).getByRole('button', { name: 'Reject' })).toHaveAccessibleDescription(/Your account is read-only/);
});

it('shows a read-only admin the read-only page when they open a merge dialog’s link', async () => {
  setMockReadOnly();
  render(<Toaster />);
  const thanos = mockStore.funkos.find((funko) => funko.name === LUKES_THANOS);

  renderRoutes(routes, { initialEntries: [SUBMISSION_ROUTES_PATHS.mergeInto(String(thanos?.id), '5')] });

  expect(await screen.findByRole('heading', { level: 1, name: 'Your account is read-only' })).toBeVisible();
});

it('offers both ways into a merge on a submission with catalogue maybe-doubles', async () => {
  renderReview();

  const row = await findRow(LUKES_THANOS);

  expect(within(row).getByRole('link', { name: 'Merge' })).toBeVisible();
  expect(within(row).getByRole('link', { name: 'This is a double of…' })).toBeVisible();
});
