import { mockStore, setMockMustChangePassword } from '@mocks/mockStore';
import { MOCK_TEMPORARY_PASSWORD } from '@mocks/mockUsers';
import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';
import { UsersPage } from '../pages/UsersPage.page';

const PASSWORD = 'shelves full of tiny heads';
const OWN_PASSWORD = 'a shelf of tiny vinyl heads';

// The admin has a password and signed in more than 10 minutes ago: creating a user asks "confirm it's you", and
// their password does it, with no passkey.
test('an admin with a password confirms it is them with it, then creates a user', async ({ page }) => {
  Object.assign(mockStore.auth, { username: 'mario', password: PASSWORD, isSignInRecent: false });
  const users = new UsersPage(page);

  await users.goto();
  await users.createUser('jyn', 'Member');
  await users.confirmWithPassword(PASSWORD);

  await expect(users.temporaryPassword).toHaveValue(/\S{15,}/);
  await users.closeCreatedUser();
  await expect(users.rowOf('jyn')).toContainText('Temporary password');
});

// luke signed in with his temporary password more than 10 minutes ago: choosing his own asks him to confirm with
// the temporary one right there, no signing out.
test('a user with a temporary password confirms with it, then chooses their own', async ({ page }) => {
  setMockMustChangePassword();
  Object.assign(mockStore.auth, {
    userName: 'luke',
    username: 'luke',
    password: MOCK_TEMPORARY_PASSWORD,
    passkeys: [],
    isSignInRecent: false,
  });
  const auth = new AuthPage(page);

  await auth.gotoSetPassword();
  await auth.chooseOwnPassword(OWN_PASSWORD);
  await auth.confirmWithTemporaryPassword(MOCK_TEMPORARY_PASSWORD);

  await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
});
