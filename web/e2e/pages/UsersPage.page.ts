import type { Locator, Page } from '@playwright/test';
import { USER_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// The admin's Users page and its "New user" dialog (its own page on phones).
export class UsersPage {
  readonly heading: Locator;
  readonly temporaryPassword: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Users' });
    this.temporaryPassword = page.getByLabel('Temporary password');
  }

  async goto() {
    await this.page.goto(USER_ROUTES_PATHS.BASE);
  }

  // Fresh from sign-in, so no "confirm it's you" step comes first.
  async createUser(username: string, role: string) {
    await this.page.getByRole('link', { name: 'New user' }).click();
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Role').selectOption({ label: role });
    await this.page.getByRole('button', { name: 'Create user' }).click();
  }

  async closeCreatedUser() {
    await this.page.getByRole('button', { name: 'Done' }).click();
  }

  rowOf(username: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: username, exact: true }) });
  }
}
