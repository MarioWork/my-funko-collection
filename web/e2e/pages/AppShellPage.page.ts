import type { Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type ThemeName = 'Light' | 'Dark' | 'System';

export class AppShellPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  async reload() {
    await this.page.reload();
  }

  // Desktop: the sidebar's Theme menu. Phone: the top bar's Menu sheet, which has Light / Dark / System buttons.
  async setTheme(name: ThemeName) {
    const menuButton = this.page.getByRole('banner').getByRole('button', { name: 'Menu' });
    const isPhone = await menuButton.isVisible();

    if (isPhone) {
      await menuButton.click();
      await this.page.getByRole('dialog').getByRole('group', { name: 'Theme' }).getByRole('button', { name }).click();

      return;
    }

    await this.page.getByRole('button', { name: 'Theme' }).click();
    await this.page.getByRole('menuitemradio', { name }).click();
  }

  // The theme is a `dark` class on <html> (Tailwind's class strategy); there is no accessible signal to read instead.
  async hasDarkTheme() {
    return this.page.locator('html').evaluate((html) => html.classList.contains('dark'));
  }
}
