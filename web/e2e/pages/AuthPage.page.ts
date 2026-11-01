import type { Locator, Page } from '@playwright/test';
import { AUTH_ROUTES_PATHS, AUTH_SEARCH_PARAMS } from '../../src/application/routes/routesUtils';

// The pages outside the app shell: the first run (/setup), the login page and "choose your password".
export class AuthPage {
  readonly setupHeading: Locator;
  readonly loginHeading: Locator;
  readonly setPasswordHeading: Locator;
  readonly devModeBanner: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupHeading = page.getByRole('heading', { level: 1, name: "Let's get you set up!" });
    this.loginHeading = page.getByRole('heading', { level: 1, name: 'Welcome back!' });
    this.setPasswordHeading = page.getByRole('heading', { level: 1, name: 'Choose your password' });
    this.devModeBanner = page.getByRole('note', { name: 'Development mode' });
  }

  async gotoSetup(code: string) {
    const params = new URLSearchParams({ [AUTH_SEARCH_PARAMS.CODE]: code });

    await this.page.goto(`${AUTH_ROUTES_PATHS.SETUP}?${params.toString()}`);
  }

  async createFirstPasskey(name: string, passkeyName: string) {
    await this.page.getByLabel('What should we call you?').fill(name);
    await this.page.getByLabel('Passkey name (optional)').fill(passkeyName);
    await this.page.getByRole('button', { name: 'Create my passkey' }).click();
  }

  async gotoLogin() {
    await this.page.goto(AUTH_ROUTES_PATHS.LOGIN);
  }

  // The dev sign-in picker (yarn dev only): fills the password form with a seeded user and submits it.
  async signInAsSeededUser(option: string) {
    const form = this.page.getByRole('form', { name: 'Sign in with a password' });
    await form.getByLabel('Sign in as…').selectOption(option);
  }

  async signInWithPassword(username: string, password: string) {
    const form = this.page.getByRole('form', { name: 'Sign in with a password' });
    await form.getByLabel('Username').fill(username);
    await form.getByLabel('Password').fill(password);
    await form.getByRole('button', { name: 'Sign in with password' }).click();
  }

  async gotoSetPassword() {
    await this.page.goto(AUTH_ROUTES_PATHS.SET_PASSWORD);
  }

  // The page a temporary-password sign-in lands on. The button sits under the form (it submits it by id).
  async chooseOwnPassword(password: string) {
    const form = this.page.getByRole('form', { name: 'Choose your password' });
    await form.getByLabel('New password').fill(password);
    await this.page.getByRole('button', { name: 'Save and open my collection' }).click();
  }

  // On that page, when the recent sign-in is more than 10 minutes old: the temporary password confirms it.
  async confirmWithTemporaryPassword(password: string) {
    await this.page.getByLabel('Your current password').fill(password);
    await this.page.getByRole('button', { name: 'Confirm with password' }).click();
  }

  async signInWithPasskey() {
    await this.page.getByRole('button', { name: 'Sign in with passkey' }).click();
  }
}
