import { renderRoutes, screen, within } from '@test-utils';
import { itemRoutes } from '@application/routes/featureRoutes/itemRoutes';
import { ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockFunkoRow, MockItemRow } from '@mocks/mockStore.type';

const FUNKO_NAME = 'Pikachu';
const EXCLUSIVE = 'Pokémon Center';
const QUANTITY = 3;
const PRICE_CENTS = 1299;
const PIKACHU_ITEMS_URL = `${ITEM_ROUTES_PATHS.BASE}?q=${FUNKO_NAME}`;

type PikachuItem = {
  funko: MockFunkoRow;
  item: MockItemRow;
};

// The seed's Pikachu and the first item it is in; its other items go, so the page shows one card.
function onlyPikachuItem(): PikachuItem {
  const funko = mockStore.funkos.find((candidate) => candidate.name === FUNKO_NAME);
  const item = mockStore.items.find((candidate) => candidate.funkoId === funko?.id);

  if (!funko || !item) throw new Error(`The mock seed has no ${FUNKO_NAME} item`);

  const otherItems = mockStore.items.filter((candidate) => candidate.funkoId === funko.id && candidate !== item);

  for (const otherItem of otherItems) mockStore.items.splice(mockStore.items.indexOf(otherItem), 1);

  return { funko, item };
}

function rowById<Row extends { id: number }>(rows: Row[], id: number | null | undefined): Row {
  const row = rows.find((candidate) => candidate.id === id);

  if (!row) throw new Error(`The mock seed has no row ${id}`);

  return row;
}

async function findCard(name: string) {
  const grid = await screen.findByRole('list', { name: 'Items' });
  const card = within(grid)
    .getAllByRole('listitem')
    .find((listItem) => within(listItem).queryByRole('button', { name: `Actions for ${name}` }));

  if (!card) throw new Error(`No card for ${name}`);

  return card;
}

it('shows an item card with its collection, copies and menu on the photo, and number, name, series, chase and exclusive under it', async () => {
  const { funko, item } = onlyPikachuItem();
  const series = rowById(mockStore.series, mockStore.series[0]?.id);
  Object.assign(funko, { isChase: true, exclusive: EXCLUSIVE, seriesId: series.id });
  Object.assign(item, { quantity: QUANTITY, purchasePriceCents: PRICE_CENTS });
  const collection = rowById(mockStore.collections, item.collectionId);
  const category = rowById(mockStore.categories, funko.categoryId);
  renderRoutes(itemRoutes, { initialEntries: [PIKACHU_ITEMS_URL] });

  const card = await findCard(FUNKO_NAME);

  expect(within(card).getByText(collection.name)).toBeVisible();
  expect(within(card).getByText(`×${QUANTITY}`)).toBeVisible();
  expect(within(card).getByText(`#${funko.number} ${FUNKO_NAME}`)).toBeVisible();
  expect(within(card).getByText(series.name)).toBeVisible();
  expect(within(card).getByText('Chase')).toBeVisible();
  expect(within(card).getByText(`Exclusive: ${EXCLUSIVE}`)).toBeVisible();
  expect(within(card).queryByText(/12,99|12\.99/)).not.toBeInTheDocument();
  expect(within(card).queryByText(new RegExp(category.name))).not.toBeInTheDocument();
});

it('leaves out the copies, chase and exclusive lines when the item has none of them', async () => {
  const { funko, item } = onlyPikachuItem();
  Object.assign(funko, { isChase: false, exclusive: '' });
  item.quantity = 1;
  renderRoutes(itemRoutes, { initialEntries: [PIKACHU_ITEMS_URL] });

  const card = await findCard(FUNKO_NAME);

  expect(within(card).queryByText(/^×/)).not.toBeInTheDocument();
  expect(within(card).queryByText('Chase')).not.toBeInTheDocument();
  expect(within(card).queryByText(/^Exclusive/)).not.toBeInTheDocument();
});
