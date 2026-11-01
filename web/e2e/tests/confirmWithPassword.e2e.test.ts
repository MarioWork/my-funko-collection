import { mockStore } from '@mocks/mockStore';
import { expect, test } from '../fixtures/app.fixture';
import { UsersPage } from '../pages/UsersPage.page';

const PASSWORD = 'shelves full of tiny heads';

// The admin has a password and signed in more than 10 minutes ago: creating a user asks "confirm it's you", and
// their password does it, with no passkey.
test('an admin with a password confirms it is them with it, then creates a user', async ({ page }) => {
  Object.assign(mockStore.auth, { username: 'mario', password: PASSWORD, isSignInRecent: false });
  const users = new UsersPage(page);

  await users.goto();
  await users.createUser('rey', 'Member');
  await users.confirmWithPassword(PASSWORD);

  await expect(users.temporaryPassword).toHaveValue(/\S{15,}/);
  await users.closeCreatedUser();
  await expect(users.rowOf('rey')).toContainText('Temporary password');
});
