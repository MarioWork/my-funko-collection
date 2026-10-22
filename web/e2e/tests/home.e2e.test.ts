import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';

const SEED_FUNKO_COUNT = '30';

test('home shows the catalog size from the stats endpoint', async ({ page }) => {
  await page.goto(BASE_ROUTES_PATHS.HOME);

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Overview' })).toContainText(`Funkos${SEED_FUNKO_COUNT}`);
});
