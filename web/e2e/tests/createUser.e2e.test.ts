import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';
import { SettingsPage } from '../pages/SettingsPage.page';
import { UsersPage } from '../pages/UsersPage.page';

const USERNAME = 'jyn';
const OWN_PASSWORD = 'a shelf of tiny vinyl heads';

// Signed in as the admin (the fixture's default): a new user, their temporary password handed over, their first
// sign-in, and the password they choose before the app opens.
test('an admin creates a user, who signs in with the temporary password and chooses their own', async ({ page }) => {
  const auth = new AuthPage(page);
  const settings = new SettingsPage(page);
  const users = new UsersPage(page);

  await users.goto();
  await users.createUser(USERNAME, 'Member');
  await expect(users.temporaryPassword).toHaveValue(/\S{15,}/);
  const temporaryPassword = await users.temporaryPassword.inputValue();
  await users.closeCreatedUser();
  await expect(users.rowOf(USERNAME)).toContainText('Temporary password');

  await settings.goto();
  await settings.signOut();
  await auth.signInWithPassword(USERNAME, temporaryPassword);
  await expect(auth.setPasswordHeading).toBeVisible();

  await auth.chooseOwnPassword(OWN_PASSWORD);
  await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
});
