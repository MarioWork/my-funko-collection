import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { addRoutes } from '@application/routes/featureRoutes/addRoutes';
import { categoryRoutes } from '@application/routes/featureRoutes/categoryRoutes';
import { tagRoutes } from '@application/routes/featureRoutes/tagRoutes';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';

const PHOTOS_REQUIRED_MESSAGE = 'Add at least one image';
const PREVIEW_URL = 'blob:photo-preview';

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

  // Base UI's combobox chips have no role; data-slot is the shadcn wrapper's hook for them.
  await waitFor(() => expect(screen.getByText('Shelf 9', { selector: '[data-slot=combobox-chip]' })).toBeVisible());
});

describe('saving without a photo', () => {
  // jsdom has no object URLs; the picker makes one for each photo's preview.
  beforeEach(() => {
    Object.assign(URL, { createObjectURL: vi.fn(() => PREVIEW_URL), revokeObjectURL: vi.fn() });
  });

  it('asks for a photo, and drops the message once one is picked', async () => {
    renderAddForm();

    await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'No Photo Pop');
    await userEvent.type(screen.getByRole('textbox', { name: 'Number' }), '2');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Pop! Games');
    await userEvent.click(screen.getByRole('button', { name: 'Save funko' }));

    const photoInput = screen.getByLabelText('Image files');

    expect(await screen.findByText(PHOTOS_REQUIRED_MESSAGE)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choose images' })).toHaveAccessibleDescription(PHOTOS_REQUIRED_MESSAGE);
    expect(screen.queryByRole('region', { name: 'Saved' })).not.toBeInTheDocument();

    await userEvent.upload(photoInput, new File([new Uint8Array([1, 2, 3])], 'front.png', { type: 'image/png' }));

    await waitFor(() => expect(screen.queryByText(PHOTOS_REQUIRED_MESSAGE)).not.toBeInTheDocument());
  });
});
