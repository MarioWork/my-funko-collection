import { expect, test } from '../fixtures/app.fixture';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';
import { FunkoListPage } from '../pages/FunkoListPage.page';

test('deleting a funko that sits in a collection asks to remove it there too', async ({ page }) => {
  const list = new FunkoListPage(page);
  const detail = new FunkoDetailPage(page);

  await list.goto();
  await list.search('pikachu');
  await expect(list.tiles).toHaveCount(1);
  await list.openFunko('Pikachu');
  await expect(detail.title).toHaveText('Pikachu');

  await detail.openDeleteDialog('Pikachu');

  const dialog = page.getByRole('alertdialog');

  await expect(dialog.getByRole('checkbox', { name: /Also remove it from Owned/ })).toBeVisible();

  await detail.confirmDelete({ alsoRemoveFromCollections: true });

  await expect(page).toHaveURL(/\/funkos$/);

  await list.search('pikachu');

  await expect(list.tiles).toHaveCount(0);
  await expect(list.emptyState).toBeVisible();
});
