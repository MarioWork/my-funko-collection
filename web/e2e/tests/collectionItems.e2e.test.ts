import { expect, test } from '../fixtures/app.fixture';
import { CollectionDetailPage } from '../pages/CollectionDetailPage.page';

const OWNED_ID = '1';
const SEED_OWNED_FUNKO = 'Spider-Man';

test('a collection page offers no way to add a funko or an item', async ({ page }) => {
  const collection = new CollectionDetailPage(page);

  await collection.goto(OWNED_ID);

  await expect(collection.main.getByRole('heading', { level: 1, name: 'Owned' })).toBeVisible();
  await expect(collection.addControls()).toHaveCount(0);
});

test('removing an item can be undone from the toast', async ({ page }) => {
  const collection = new CollectionDetailPage(page);

  await collection.goto(OWNED_ID);
  await collection.showAsList();
  await collection.removeItem(SEED_OWNED_FUNKO);

  await expect(collection.itemFor(SEED_OWNED_FUNKO)).toHaveCount(0);

  await collection.undo();

  await expect(collection.itemFor(SEED_OWNED_FUNKO)).toHaveCount(1);
});
