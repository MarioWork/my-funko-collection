import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { categoryRoutes } from '@application/routes/featureRoutes/categoryRoutes';
import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';

const renderPage = () => renderRoutes(categoryRoutes, { initialEntries: [CATEGORY_ROUTES_PATHS.BASE] });

it('lists the seeded categories and disables delete, with the reason, for the ones in use', async () => {
  renderPage();

  expect(await screen.findByText('Pop! Marvel')).toBeVisible();
  const deleteInUse = screen.getByRole('button', { name: /Delete Pop! Marvel/ });

  // Kept focusable so its tooltip can say why: disabled for assistive tech, with the reason as its description.
  expect(deleteInUse).toHaveAttribute('aria-disabled', 'true');
  expect(deleteInUse).toHaveAccessibleDescription(/in use, so it cannot be deleted/);
});

it('adds a category through the New category form and shows it in the list', async () => {
  renderPage();

  // The header button (desktop) and the round + (phones) share the name; only one shows at a time, both go there.
  const [newCategoryLink] = await screen.findAllByRole('link', { name: 'New category' });

  await userEvent.click(newCategoryLink);

  const addForm = await screen.findByRole('dialog', { name: 'New category' });

  await userEvent.type(within(addForm).getByLabelText('Name'), 'Pop! Rocks');
  await userEvent.click(within(addForm).getByRole('button', { name: 'Add category' }));

  expect(await screen.findByText('Pop! Rocks')).toBeVisible();
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'New category' })).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Delete Pop! Rocks' })).toBeEnabled();
});

it('renames a category inline', async () => {
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Rename Star Wars' }));

  const nameField = screen.getByRole('textbox', { name: 'Name' });

  expect(nameField).toHaveValue('Star Wars');

  await userEvent.clear(nameField);
  await userEvent.type(nameField, 'Pop! Star Wars');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Pop! Star Wars')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
});
