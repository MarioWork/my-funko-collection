import { expect, test } from '../fixtures/app.fixture';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';
import { FunkoListPage } from '../pages/FunkoListPage.page';

test('deleting a funko other users have says how many have it and asks why', async ({ page }) => {
  const list = new FunkoListPage(page);
  const detail = new FunkoDetailPage(page);

  await list.goto();
  await list.search('grogu');
  await expect(list.tiles).toHaveCount(1);
  await list.openFunko('Grogu');
  await expect(detail.title).toHaveText('Grogu');

  await detail.openDeleteDialog('Grogu');

  await expect(detail.removeDialog).toContainText('2 other users have it in their collections');

  await detail.confirmRemove('A double of Grogu #368');

  await expect(page).toHaveURL(/\/funkos$/);

  await list.search('grogu');

  await expect(list.tiles).toHaveCount(0);
  await expect(list.emptyState).toBeVisible();
});
