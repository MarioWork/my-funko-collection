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

it('gives the default collection its own card with the copy details, and drops it when removed', async () => {
  renderAddForm();

  const ownedCard = await screen.findByRole('article', { name: 'Owned' });

  expect(within(ownedCard).getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(1);
  expect(within(ownedCard).getByRole('textbox', { name: 'Paid (EUR)' })).toBeVisible();

  await userEvent.click(within(ownedCard).getByRole('button', { name: "Don't add to Owned" }));

  expect(screen.queryByRole('article', { name: 'Owned' })).not.toBeInTheDocument();
  expect(screen.getByText(/saved to the catalog only/)).toBeVisible();
});

it('folds a collection card to one row that still shows what it holds', async () => {
  renderAddForm();

  const ownedCard = await screen.findByRole('article', { name: 'Owned' });
  const toggle = within(ownedCard).getByRole('button', { name: 'Owned' });

  await userEvent.type(within(ownedCard).getByRole('textbox', { name: 'Paid (EUR)' }), '14.99');
  await userEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveAccessibleDescription(/×1 · 14,99/);
});

it('folds the other collection cards when another collection is picked', async () => {
  renderAddForm();

  const ownedToggle = within(await screen.findByRole('article', { name: 'Owned' })).getByRole('button', {
    name: 'Owned',
  });

  await userEvent.type(screen.getByRole('combobox', { name: 'Add to collections' }), 'Wish');
  await userEvent.click(await screen.findByRole('option', { name: 'Wishlist' }));

  const wishlistCard = await screen.findByRole('article', { name: 'Wishlist' });

  expect(within(wishlistCard).getByRole('button', { name: 'Wishlist' })).toHaveAttribute('aria-expanded', 'true');
  expect(ownedToggle).toHaveAttribute('aria-expanded', 'false');
});

it('shows a bad price inside its own collection card when Save is pressed', async () => {
  renderAddForm();

  const ownedCard = await screen.findByRole('article', { name: 'Owned' });

  await userEvent.type(within(ownedCard).getByRole('textbox', { name: 'Paid (EUR)' }), 'lots');
  await userEvent.click(screen.getByRole('button', { name: 'Save funko' }));

  expect(await within(ownedCard).findByText('Use a number like 14.99')).toBeVisible();
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

  it('opens a picked image big when its thumbnail is clicked', async () => {
    renderAddForm();

    await userEvent.upload(
      await screen.findByLabelText('Image files'),
      new File([new Uint8Array([1, 2, 3])], 'front.png', { type: 'image/png' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'View front.png' }));

    expect(await screen.findByRole('dialog', { name: /Images to upload, image 1 of 1/ })).toBeVisible();
  });

  it('marks the first image as main and moves another to the front when its star is pressed', async () => {
    renderAddForm();

    await userEvent.upload(await screen.findByLabelText('Image files'), [
      new File([new Uint8Array([1])], 'front.png', { type: 'image/png' }),
      new File([new Uint8Array([2])], 'back.png', { type: 'image/png' }),
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Make back.png the main image' }));

    const [first] = within(screen.getByRole('list', { name: 'Images to upload' })).getAllByRole('listitem');

    expect(first).toHaveTextContent('Main');
    expect(within(first).getByRole('button', { name: 'View back.png' })).toBeVisible();
  });
});
