import { AuthStateUtil } from '@app-types/utility';
import { MOCK_SETUP_CODE } from '@mocks/mockStore';
import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';
import { FunkoListPage } from '../pages/FunkoListPage.page';
import { SettingsPage } from '../pages/SettingsPage.page';

test.use({ authState: AuthStateUtil.SETUP });

// The real WebAuthn ceremonies, run by Chrome's virtual authenticator against the mocks: the first run creates a
// passkey on it, and after signing out that same passkey signs back in.
test('first run, sign out, and sign back in with the passkey', async ({ page, virtualAuthenticator: _ }) => {
  const auth = new AuthPage(page);
  const settings = new SettingsPage(page);

  await auth.gotoSetup(MOCK_SETUP_CODE);
  await expect(auth.setupHeading).toBeVisible();
  await auth.createFirstPasskey('Mario', 'Test laptop');
  await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  await settings.goto();
  await expect(settings.passkeys).toHaveCount(1);
  await expect(settings.passkeys).toContainText('Test laptop');
  await settings.signOut();
  await expect(auth.loginHeading).toBeVisible();

  // A signed-out visit to a page goes through the login page and comes back to it.
  await new FunkoListPage(page).goto();
  await expect(auth.loginHeading).toBeVisible();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Ffunkos$/);
  await auth.signInWithPasskey();
  await expect(page).toHaveURL(/\/funkos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Funkos' })).toBeVisible();
});
