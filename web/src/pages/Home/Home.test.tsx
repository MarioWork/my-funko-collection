import { renderRoutes, screen, within } from '@test-utils';
import { BASE_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { funkosInOwnCollectionsPath } from '@utils/funkoLinkUtils';

const routes = [{ path: BASE_ROUTES_PATHS.HOME, lazy: () => import('./Home.route') }];

it('shows the stats of the user’s own collections, the recent funkos and every collection', async () => {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  const overview = await screen.findByRole('region', { name: 'Overview' });

  // The mock seed has 30 funkos in the catalogue, 20 of them in a collection, with two images each.
  expect(overview).toHaveTextContent(/Funkos20/);
  expect(overview).toHaveTextContent(/Images40/);
  expect(screen.getByRole('heading', { name: 'Recently added' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Owned' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Wishlist' })).toBeVisible();
});

it('links the Funkos tile to the funkos in the user’s collections and the Images tile to the Images page', async () => {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  const overview = await screen.findByRole('region', { name: 'Overview' });

  expect(within(overview).getByRole('link', { name: 'Funkos' })).toHaveAttribute('href', funkosInOwnCollectionsPath());
  expect(within(overview).getByRole('link', { name: 'Images' })).toHaveAttribute('href', IMAGE_ROUTES_PATHS.BASE);
});
