import { expect, test } from '../fixtures/app.fixture';
import { AppShellPage } from '../pages/AppShellPage.page';

const SEED_FUNKO_COUNT = '30';

test('home shows the catalog size from the stats endpoint', async ({ page }) => {
  await new AppShellPage(page).goto();

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Overview' })).toContainText(`Funkos${SEED_FUNKO_COUNT}`);
});
