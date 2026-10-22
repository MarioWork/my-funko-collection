import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';
import { AppShellPage } from '../pages/AppShellPage.page';

test('the chosen theme survives a reload', async ({ page }) => {
  const shell = new AppShellPage(page);

  await page.goto(BASE_ROUTES_PATHS.HOME);
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

  await shell.setTheme('Dark');
  await expect.poll(() => shell.hasDarkTheme()).toBe(true);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect.poll(() => shell.hasDarkTheme()).toBe(true);
});
