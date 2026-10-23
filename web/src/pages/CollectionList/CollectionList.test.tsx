import { renderRoutes, screen, within } from '@test-utils';
import { collectionRoutes } from '@application/routes/featureRoutes/collectionRoutes';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';

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
