import { renderRoutes, screen, userEvent } from '@test-utils';
import { funkoRoutes } from '@application/routes/featureRoutes/funkoRoutes';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { catalogueFunkos } from '@mocks/mockCatalogueUtils';
import { MOCK_MEMBER_ID } from '@mocks/mockUsers';
import { addMockSubmission, mockStore, setMockReadOnly } from '@mocks/mockStore';
import { nextId } from '@mocks/mockStoreUtils';
import { FUNKO_PAGE_SIZE } from './funkoListUtils';

const EXTRA_FUNKO_NAME = 'Hulk';
// Two in the seed: the regular one and the chase.
const SEARCHED_NAME = 'Thanos';
const PAGE_SIZE = Number(FUNKO_PAGE_SIZE);

// Enough Hulks to pass one page, so the list needs a second one. Returns how many funkos the list holds then.
function addHulks(count: number): number {
  const [template] = mockStore.funkos;

  if (!template) throw new Error('The mock seed has no funkos');

  for (let i = 0; i < count; i++) {
    mockStore.funkos.push({ ...template, id: nextId(mockStore.funkos), name: `${EXTRA_FUNKO_NAME} ${i + 1}` });
  }

  return catalogueFunkos().length;
}

const renderPage = () => renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.BASE] });

it('shows the first page and appends the next one on Load more', async () => {
  const total = addHulks(PAGE_SIZE);
  renderPage();

  expect(await screen.findByText(`Showing ${PAGE_SIZE} of ${total} funkos`)).toBeVisible();

  await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

  expect(await screen.findByText(`All ${total} funkos`)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
});

it('starts over from the first page when the search changes', async () => {
  const total = addHulks(PAGE_SIZE);
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
  expect(await screen.findByText(`All ${total} funkos`)).toBeVisible();

  await userEvent.type(screen.getByRole('searchbox', { name: 'Search funkos' }), SEARCHED_NAME);

  // A new list from page 1: the appended second page of the old one is gone.
  expect(await screen.findByText('All 2 funkos')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
});

it('lists the signed-in user’s own waiting submission and never another member’s', async () => {
  addMockSubmission({ name: 'Hulk Mine' });
  addMockSubmission({ name: 'Hulk Theirs', submittedById: MOCK_MEMBER_ID });
  renderRoutes(funkoRoutes, { initialEntries: [`${FUNKO_ROUTES_PATHS.BASE}?q=${EXTRA_FUNKO_NAME}`] });

  expect(await screen.findByText('Hulk Mine')).toBeVisible();
  expect(screen.queryByText('Hulk Theirs')).not.toBeInTheDocument();
});

it('shows Scan and New disabled, saying the account is read-only, to a read-only user', async () => {
  setMockReadOnly();
  renderPage();

  const scanButtons = await screen.findAllByRole('button', { name: 'Scan' });
  const newButtons = screen.getAllByRole('button', { name: 'New funko' });
  const addButton = screen.getByRole('button', { name: 'Add funko' });

  for (const button of [...scanButtons, ...newButtons, addButton]) {
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription(/Your account is read-only/);
  }
  expect(screen.queryByRole('link', { name: 'New funko' })).not.toBeInTheDocument();
});
