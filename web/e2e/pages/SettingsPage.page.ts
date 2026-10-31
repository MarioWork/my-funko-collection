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

  // Fresh from sign-in, so no "confirm it's you" step comes first.
  async setPassword(username: string, password: string) {
    await this.page.getByRole('button', { name: 'Set a password' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Set a password' });
    await dialog.getByLabel('Username').fill(username);
    await dialog.getByLabel('New password').fill(password);
    await dialog.getByRole('button', { name: 'Save password' }).click();
    await dialog.waitFor({ state: 'hidden' });
  }

  async signOut() {
    await this.page.getByRole('button', { name: 'Sign out', exact: true }).click();
  }
}
