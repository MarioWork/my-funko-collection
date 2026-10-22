import { expect, test } from '../fixtures/app.fixture';
import { CollectionDetailPage } from '../pages/CollectionDetailPage.page';

const OWNED_ID = '1';

test('adds a catalog funko to Owned with a tag', async ({ page }) => {
  const collection = new CollectionDetailPage(page);

  await collection.goto(OWNED_ID);
  await collection.openAddItem();
  await collection.pickFunko('groot', /Groot/);
  await collection.addTag('Box 1');
  await collection.submitAddItem();

  await expect(page.getByRole('dialog')).toBeHidden();

  const row = collection.rowFor('Groot');

  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Box 1');
});
