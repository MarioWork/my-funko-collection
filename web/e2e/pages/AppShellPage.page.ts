import type { Page } from '@playwright/test';

export class AppShellPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setTheme(name: 'Light' | 'Dark' | 'System') {
    await this.page.getByRole('button', { name: 'Theme' }).click();
    await this.page.getByRole('menuitem', { name }).click();
  }

  async hasDarkTheme() {
    return this.page.locator('html').evaluate((html) => html.classList.contains('dark'));
  }
}
