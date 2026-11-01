import { renderRoutes, screen, within } from '@test-utils';
import { itemRoutes } from '@application/routes/featureRoutes/itemRoutes';
import { ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import { mockStore } from '@mocks/mockStore';

const FUNKO_NAME = 'Pikachu';
const EXCLUSIVE = 'Pokémon Center';
const QUANTITY = 3;
const PRICE_CENTS = 1299;

// The seed's Pikachu as the only item it is in, made a chase exclusive in a series, with three copies and a price.
function pikachuItem() {
  const funko = mockStore.funkos.find((candidate) => candidate.name === FUNKO_NAME);
  const [item] = mockStore.items.filter((candidate) => candidate.funkoId === funko?.id);
  const series = mockStore.series[0];
  const collection = mockStore.collections.find((candidate) => candidate.id === item?.collectionId);
  const category = mockStore.categories.find((candidate) => candidate.id === funko?.categoryId);

  if (!funko || !item || !series || !collection || !category)
    throw new Error(`The mock seed has no ${FUNKO_NAME} item`);

  for (let index = mockStore.items.length - 1; index >= 0; index -= 1) {
    const isOtherPikachuItem = mockStore.items[index]?.funkoId === funko.id && mockStore.items[index] !== item;

    if (isOtherPikachuItem) mockStore.items.splice(index, 1);
  }
  Object.assign(funko, { isChase: true, exclusive: EXCLUSIVE, seriesId: series.id });
  Object.assign(item, { quantity: QUANTITY, purchasePriceCents: PRICE_CENTS });

  return { funko, series, collection, category };
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
  const { funko, series, collection, category } = pikachuItem();
  renderRoutes(itemRoutes, { initialEntries: [`${ITEM_ROUTES_PATHS.BASE}?q=${FUNKO_NAME}`] });

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
  const { funko } = pikachuItem();
  Object.assign(funko, { isChase: false, exclusive: '' });
  const item = mockStore.items.find((candidate) => candidate.funkoId === funko.id);
  if (item) item.quantity = 1;
  renderRoutes(itemRoutes, { initialEntries: [`${ITEM_ROUTES_PATHS.BASE}?q=${FUNKO_NAME}`] });

  const card = await findCard(FUNKO_NAME);

  expect(within(card).queryByText(/^×/)).not.toBeInTheDocument();
  expect(within(card).queryByText('Chase')).not.toBeInTheDocument();
  expect(within(card).queryByText(/^Exclusive/)).not.toBeInTheDocument();
});
