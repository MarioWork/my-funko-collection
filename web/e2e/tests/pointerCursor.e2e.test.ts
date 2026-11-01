import { expect, test } from '../fixtures/app.fixture';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';
import { FunkoListPage } from '../pages/FunkoListPage.page';

// The vendored menus set cursor-default on their items; index.css gives every clickable control the hand instead.
test('menu items and buttons show the pointing hand', async ({ page }) => {
  const list = new FunkoListPage(page);
  const detail = new FunkoDetailPage(page);

  await list.goto();
  await list.search('pikachu');
  await expect(list.tiles).toHaveCount(1);
  await list.openFunko('Pikachu');
  await expect(detail.title).toHaveText('Pikachu');
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCSS('cursor', 'pointer');

  await detail.openActionsMenu('Pikachu');
  await detail.hoverMenuItem('Export');

  await expect(detail.menuItem('Export')).toHaveCSS('cursor', 'pointer');
});
