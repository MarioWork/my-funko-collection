import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { collectionRoutes } from '@application/routes/featureRoutes/collectionRoutes';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import RouteError from '@pages/Error/RouteError';
import { setMockReadOnly } from '@mocks/mockStore';

it('shows every collection with its counts and marks the default one', async () => {
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.BASE] });

  await screen.findByRole('link', { name: 'Owned' });

  const ownedCard = screen
    .getAllByRole('listitem')
    .find((card) => within(card).queryByRole('link', { name: 'Owned' }) !== null);

  expect(ownedCard).toHaveTextContent('Default');
  expect(ownedCard).toHaveTextContent(/15 funkos/);
  expect(screen.getByRole('link', { name: 'Wishlist' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Actions for Wishlist' })).toBeVisible();
});

it('exports the collection’s funkos from the Export submenu of its actions', async () => {
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.BASE] });

  await userEvent.click(await screen.findByRole('button', { name: 'Actions for Owned' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Export' }));

  const spreadsheet = await screen.findByRole('menuitem', { name: /Spreadsheet/ });

  expect(spreadsheet).toHaveAttribute('href', expect.stringMatching(/\/export\/funkos\.xlsx\?collectionId=\d+$/));
  expect(spreadsheet).toHaveAttribute('download');
});

it('opens the edit dialog over the list, without leaving it, from a collection’s actions', async () => {
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.BASE] });

  await userEvent.click(await screen.findByRole('button', { name: 'Actions for Wishlist' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));

  expect(await screen.findByRole('dialog', { name: /Wishlist|Edit/ })).toBeVisible();
  // Still the list underneath (a modal dialog hides it from assistive tech, so it is queried as hidden).
  expect(screen.getByRole('heading', { level: 1, name: 'Collections', hidden: true })).toBeInTheDocument();
});

it('shows New, Edit, Make default and Delete disabled, saying why, but keeps Export for a read-only user', async () => {
  setMockReadOnly();
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.BASE] });

  const newCollection = await screen.findAllByRole('button', { name: 'New collection' });
  await userEvent.click(screen.getByRole('button', { name: 'Actions for Wishlist' }));
  await screen.findByRole('menuitem', { name: 'Export' });
  const items = ['Edit', 'Make default', 'Delete'].map((name) => screen.getByRole('menuitem', { name }));

  for (const control of [...newCollection, ...items]) {
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).toHaveAccessibleDescription(/Your account is read-only/);
  }
  expect(screen.getByRole('menuitem', { name: 'Export' })).not.toHaveAttribute('aria-disabled');
});

it('says the account is read-only when a read-only user opens the New collection address', async () => {
  setMockReadOnly();

  renderRoutes([{ errorElement: <RouteError />, children: collectionRoutes }], {
    initialEntries: [`${COLLECTION_ROUTES_PATHS.BASE}/${COLLECTION_ROUTES_PATHS.ADD}`],
  });

  expect(await screen.findByRole('heading', { level: 1, name: 'Your account is read-only' })).toBeVisible();
});
