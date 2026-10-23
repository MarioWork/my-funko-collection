import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { addRoutes } from '@application/routes/featureRoutes/addRoutes';
import { categoryRoutes } from '@application/routes/featureRoutes/categoryRoutes';
import { tagRoutes } from '@application/routes/featureRoutes/tagRoutes';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';

// The category and tag list routes are mounted too: creating one on the spot posts to their own actions.
const renderAddForm = () =>
  renderRoutes([...addRoutes, ...categoryRoutes, ...tagRoutes], { initialEntries: [ADD_ROUTES_PATHS.MANUAL] });

it('creates a missing category from the + beside the dropdown and picks it', async () => {
  renderAddForm();

  await userEvent.click(await screen.findByRole('button', { name: 'New category' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'New category' }), 'Pop! Rocks');
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));

  const categorySelect = screen.getByRole('combobox', { name: 'Category' });

  await waitFor(() => expect(within(categorySelect).getByRole('option', { name: 'Pop! Rocks' })).toBeInTheDocument());
  await waitFor(() => expect(categorySelect).toHaveDisplayValue('Pop! Rocks'));
});

it('offers to create a tag no one has yet, and picks it once created', async () => {
  renderAddForm();

  const tagsInput = await screen.findByRole('combobox', { name: 'Tags' });

  await userEvent.type(tagsInput, 'Shelf 9');
  await userEvent.click(await screen.findByRole('option', { name: 'Create “Shelf 9”' }));

  await waitFor(() => expect(screen.getByText('Shelf 9', { selector: '[data-slot=combobox-chip]' })).toBeVisible());
});
