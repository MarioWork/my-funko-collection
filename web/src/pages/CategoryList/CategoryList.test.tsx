import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { categoryRoutes } from '@application/routes/featureRoutes/categoryRoutes';
import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';

const renderPage = () => renderRoutes(categoryRoutes, { initialEntries: [CATEGORY_ROUTES_PATHS.BASE] });

it('lists the seeded categories and disables delete for the ones in use', async () => {
  renderPage();

  expect(await screen.findByText('Pop! Marvel')).toBeVisible();
  expect(screen.getByRole('button', { name: /Delete Pop! Marvel/ })).toBeDisabled();
});

it('adds a category through the form and shows it in the list', async () => {
  renderPage();

  const addForm = await screen.findByRole('region', { name: 'Add a category' });

  await userEvent.type(within(addForm).getByLabelText('Name'), 'Pop! Rocks');
  await userEvent.click(within(addForm).getByRole('button', { name: 'Add category' }));

  expect(await screen.findByText('Pop! Rocks')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Delete Pop! Rocks' })).toBeEnabled();
});

it('renames a category inline', async () => {
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Rename Star Wars' }));

  const nameField = screen.getByDisplayValue('Star Wars');

  await userEvent.clear(nameField);
  await userEvent.type(nameField, 'Pop! Star Wars');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Pop! Star Wars')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
});
