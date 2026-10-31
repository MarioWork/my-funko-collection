import type { Locator, Page } from '@playwright/test';
import { AUTH_ROUTES_PATHS, AUTH_SEARCH_PARAMS } from '../../src/application/routes/routesUtils';

// The two pages outside the app shell: the first run (/setup) and the login page.
export class AuthPage {
  readonly setupHeading: Locator;
  readonly loginHeading: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupHeading = page.getByRole('heading', { level: 1, name: "Let's get you set up!" });
    this.loginHeading = page.getByRole('heading', { level: 1, name: 'Welcome back!' });
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

  async signInWithPassword(username: string, password: string) {
    const form = this.page.getByRole('form', { name: 'Sign in with a password' });
    await form.getByLabel('Username').fill(username);
    await form.getByLabel('Password').fill(password);
    await form.getByRole('button', { name: 'Sign in with password' }).click();
  }

  async signInWithPasskey() {
    await this.page.getByRole('button', { name: 'Sign in with passkey' }).click();
  }
}
