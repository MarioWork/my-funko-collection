import { renderRoutes, screen, within } from '@test-utils';
import { BASE_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';

const routes = [{ path: BASE_ROUTES_PATHS.HOME, lazy: () => import('./Home.route') }];

it('shows the stats, the recent funkos and every collection', async () => {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  const overview = await screen.findByRole('region', { name: 'Overview' });

  expect(overview).toHaveTextContent(/Funkos30/);
  expect(overview).toHaveTextContent(/Images60/);
  expect(screen.getByRole('heading', { name: 'Recently added' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Owned' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Wishlist' })).toBeVisible();
});

it('links the Images tile to the Images page', async () => {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

  const overview = await screen.findByRole('region', { name: 'Overview' });

  expect(within(overview).getByRole('link', { name: 'Images' })).toHaveAttribute('href', IMAGE_ROUTES_PATHS.BASE);
});
