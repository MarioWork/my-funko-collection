import type { Locator, Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class SettingsPage {
  readonly passkeys: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.passkeys = page.getByRole('list', { name: 'Passkeys' }).getByRole('listitem');
  }

  async goto() {
    await this.page.goto(BASE_ROUTES_PATHS.SETTINGS);
  }

  async signOut() {
    await this.page.getByRole('button', { name: 'Sign out', exact: true }).click();
  }
}
