import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';
import { SettingsPage } from '../pages/SettingsPage.page';

const USERNAME = 'mario';
const PASSWORD = 'shelves full of tiny heads';

// Signed in (the fixture's default), the owner sets a password, signs out, and comes back in with it.
test('set a password in Settings, sign out, and sign back in with it', async ({ page }) => {
  const auth = new AuthPage(page);
  const settings = new SettingsPage(page);

  await settings.goto();
  await settings.setPassword(USERNAME, PASSWORD);
  await expect(page.getByRole('region', { name: 'Password' })).toContainText(`Sign in as ${USERNAME}`);
  await settings.signOut();
  await expect(auth.loginHeading).toBeVisible();

  await auth.signInWithPassword('Mario', PASSWORD);
  await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
});
