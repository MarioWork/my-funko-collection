import { http, HttpResponse } from 'msw/http';
import { deferred, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { funkoRoutes } from '@application/routes/featureRoutes/funkoRoutes';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { mockStore } from '@mocks/mockStore';
import { server, TEST_BASE_API_URL } from '@mocks/server';

const WISHLIST_NAME = 'Wishlist';
const SERVER_ERROR_STATUS = 500;

// A funko the seed does not have on the Wishlist yet.
function funkoOffTheWishlist() {
  const wishlist = mockStore.collections.find((collection) => collection.name === WISHLIST_NAME);
  const wishedIds = new Set(
    mockStore.items.filter((item) => item.collectionId === wishlist?.id).map((item) => item.funkoId),
  );

  return mockStore.funkos.find((funko) => !wishedIds.has(funko.id));
}

it('exports the funko as a spreadsheet, CSV or JSON from the Export submenu of its actions', async () => {
  const [funko] = mockStore.funkos;
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${funko?.name}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Export' }));

  const spreadsheet = await screen.findByRole('menuitem', { name: /Spreadsheet/ });

  expect(spreadsheet).toHaveAttribute(
    'href',
    expect.stringMatching(new RegExp(`/export/funkos\\.xlsx\\?funkoId=${funko?.id}$`)),
  );
  expect(spreadsheet).toHaveAttribute('download');
  expect(screen.getByRole('menuitem', { name: /JSON/ })).toHaveAttribute(
    'href',
    expect.stringContaining('funkos.json'),
  );
});

it('announces why the delete failed, as an alert in the dialog, when the funko is still in a collection', async () => {
  const [funko] = mockStore.funkos;
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${funko?.name}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

  expect(await within(dialog).findByRole('alert')).toHaveTextContent(/still in a collection/);
});

it('shows the Wishlist toggle pressed at once and flips it back when the add fails', async () => {
  const funko = funkoOffTheWishlist();
  const answer = deferred<Response>();
  server.use(http.post(`${TEST_BASE_API_URL}/collections/:collectionId/items`, () => answer.promise));
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  const toggle = await screen.findByRole('button', { name: WISHLIST_NAME });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await userEvent.click(toggle);

  expect(screen.getByRole('button', { name: WISHLIST_NAME })).toHaveAttribute('aria-pressed', 'true');

  answer.resolve(
    HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: SERVER_ERROR_STATUS }),
  );

  await waitFor(() =>
    expect(screen.getByRole('button', { name: WISHLIST_NAME })).toHaveAttribute('aria-pressed', 'false'),
  );
});

it('links to the funko that already exists when an edit makes it a copy of one', async () => {
  const ironMan = mockStore.funkos.find((funko) => funko.name === 'Iron Man');
  const deadpool = mockStore.funkos.find((funko) => funko.name === 'Deadpool');
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.edit(String(ironMan?.id))] });

  const nameField = await screen.findByRole('textbox', { name: 'Name' });
  const numberField = screen.getByRole('textbox', { name: 'Number' });
  await userEvent.clear(nameField);
  await userEvent.type(nameField, deadpool?.name ?? '');
  await userEvent.clear(numberField);
  await userEvent.type(numberField, deadpool?.number ?? '');
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  const alert = await screen.findByRole('alert');

  expect(alert).toHaveTextContent('This funko already exists');
  expect(within(alert).getByRole('link', { name: 'Open it' })).toHaveAttribute(
    'href',
    FUNKO_ROUTES_PATHS.detail(String(deadpool?.id)),
  );
});

it('folds each collection to a quick look and unfolds it to every labelled detail, notes included', async () => {
  const itemWithNotes = mockStore.items.find((item) => item.notes !== null);
  const collection = mockStore.collections.find((candidate) => candidate.id === itemWithNotes?.collectionId);
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(itemWithNotes?.funkoId))] });

  const toggle = await screen.findByRole('button', { name: collection?.name, expanded: false });

  expect(toggle).toHaveAccessibleDescription(new RegExp(`^×${itemWithNotes?.quantity}`));

  await userEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Notes')).toBeVisible();
  expect(screen.getByText(itemWithNotes?.notes ?? '')).toBeVisible();
});
