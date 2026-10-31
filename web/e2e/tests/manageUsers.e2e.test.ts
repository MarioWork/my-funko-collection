import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';
import { SettingsPage } from '../pages/SettingsPage.page';
import { UsersPage } from '../pages/UsersPage.page';

// han's temporary password expired before he used it (the mock seed): the admin gives him a new one.
test('an admin gives a user a new temporary password, which signs them in to choose their own', async ({ page }) => {
  const auth = new AuthPage(page);
  const settings = new SettingsPage(page);
  const users = new UsersPage(page);

  await users.goto();
  await users.manage('han');
  await users.giveNewTemporaryPassword();
  await expect(users.temporaryPassword).toHaveValue(/\S{15,}/);
  const temporaryPassword = await users.temporaryPassword.inputValue();

  await settings.goto();
  await settings.signOut();
  await auth.signInWithPassword('han', temporaryPassword);

  await expect(auth.setPasswordHeading).toBeVisible();
});

test('an admin makes a member an admin, then deletes another user', async ({ page }) => {
  const users = new UsersPage(page);

  await users.goto();
  await users.manage('luke');
  await users.makeAdmin();
  await expect(page.getByRole('button', { name: 'Make member' })).toBeVisible();

  await users.goto();
  await users.manage('han');
  await users.deleteUser();

  await expect(users.heading).toBeVisible();
  await expect(page.getByText('3 users')).toBeVisible();
  await expect(users.rowOf('han')).toHaveCount(0);
  await expect(users.rowOf('luke')).toContainText('Admin');
});

// leia is an admin too, so Mario is not the last one: making himself a member ends his own session.
test('an admin who makes themselves a member is signed out', async ({ page }) => {
  const auth = new AuthPage(page);
  const users = new UsersPage(page);

  await users.goto();
  await users.manage('Mario');
  await users.makeMember();

  await expect(auth.loginHeading).toBeVisible();
});
