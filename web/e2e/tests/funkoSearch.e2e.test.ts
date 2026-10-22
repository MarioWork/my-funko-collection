import { expect, test } from '../fixtures/app.fixture';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';
import { FunkoListPage } from '../pages/FunkoListPage.page';

test('searching narrows the grid and opens the funko', async ({ page }) => {
  const list = new FunkoListPage(page);
  const detail = new FunkoDetailPage(page);

  await list.goto();
  await list.search('pikachu');

  await expect(list.tiles).toHaveCount(1);
  await expect(list.tiles.first()).toContainText('Pikachu');

  await list.openFunko('Pikachu');

  await expect(detail.title).toHaveText('Pikachu');
  await expect(page.getByText('#353', { exact: true })).toBeVisible();
});
