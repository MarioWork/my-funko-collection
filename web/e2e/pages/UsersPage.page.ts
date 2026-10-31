import type { Locator, Page } from '@playwright/test';
import { USER_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// The admin's Users page, its "New user" dialog and the "Manage" dialog of one user (their own pages on phones). Every
// change confirms in an alert dialog first; fresh from sign-in, so no "confirm it's you" step comes before it.
export class UsersPage {
  readonly heading: Locator;
  readonly temporaryPassword: Locator;
  readonly makeMemberButton: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Users' });
    // Exact: the dialogs around it are titled "... new temporary password" too.
    this.makeMemberButton = page.getByRole('button', { name: 'Make member' });
    this.temporaryPassword = page.getByLabel('Temporary password', { exact: true });
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

  async manage(username: string) {
    await this.page.getByRole('link', { name: `Manage ${username}` }).click();
  }

  async makeAdmin() {
    await this.page.getByRole('button', { name: 'Make admin' }).click();
    await this.confirm('Make admin');
  }

  async makeMember() {
    await this.makeMemberButton.click();
    await this.confirm('Make member');
  }

  async giveNewTemporaryPassword() {
    await this.page.getByRole('button', { name: 'New temporary password' }).click();
    await this.confirm('Make password');
  }

  async deleteUser() {
    await this.page.getByRole('button', { name: 'Delete user' }).click();
    await this.confirm('Delete user');
  }

  // The page header's count: "3 users".
  userCount(count: number): Locator {
    return this.page.getByText(`${count} users`, { exact: true });
  }

  rowOf(username: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: username, exact: true }) });
  }

  private async confirm(buttonName: string) {
    await this.page.getByRole('alertdialog').getByRole('button', { name: buttonName }).click();
  }
}
