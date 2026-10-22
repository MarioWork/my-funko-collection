import { renderRoutes, screen } from '@test-utils';
import { collectionRoutes } from '@application/routes/featureRoutes/collectionRoutes';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';

it('shows every collection with its counts and marks the default one', async () => {
  renderRoutes(collectionRoutes, { initialEntries: [COLLECTION_ROUTES_PATHS.BASE] });

  const owned = await screen.findByRole('link', { name: 'Owned' });
  const ownedCard = owned.closest('li');

  expect(ownedCard).toHaveTextContent('Default');
  expect(ownedCard).toHaveTextContent(/15 funkos/);
  expect(screen.getByRole('link', { name: 'Wishlist' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Actions for Wishlist' })).toBeVisible();
});
