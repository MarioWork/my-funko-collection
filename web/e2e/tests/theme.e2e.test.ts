import { expect, test } from '../fixtures/app.fixture';
import { AppShellPage } from '../pages/AppShellPage.page';

test('the chosen theme survives a reload', async ({ page }) => {
  const shell = new AppShellPage(page);

  await shell.goto();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

  await shell.setTheme('Dark');
  await expect.poll(() => shell.hasDarkTheme()).toBe(true);

  await shell.reload();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect.poll(() => shell.hasDarkTheme()).toBe(true);
});
