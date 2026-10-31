import { expect, test } from '../fixtures/app.fixture';
import { AppShellPage } from '../pages/AppShellPage.page';

// The mock seed's funkos that sit in one of the user's collections (the catalogue has 30).
const OWN_FUNKO_COUNT = '20';

test('home counts the funkos in the user’s own collections from the stats endpoint', async ({ page }) => {
  await new AppShellPage(page).goto();

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Overview' })).toContainText(`Funkos${OWN_FUNKO_COUNT}`);
});
