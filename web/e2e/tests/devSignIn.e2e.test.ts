import { AuthStateUtil } from '@app-types/utility';
import { SUBMISSION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';
import { expect, test } from '../fixtures/app.fixture';
import { AuthPage } from '../pages/AuthPage.page';

test.use({ authState: AuthStateUtil.SIGNED_OUT });

// The dev server (never a build) offers the seeded users on the sign-in page; picking one signs in through the
// normal password route, here the mock one.
test('signs in as a seeded member from the dev sign-in picker', async ({ page }) => {
  const auth = new AuthPage(page);

  await auth.gotoLogin();
  await expect(auth.devModeBanner).toContainText('Development mode');
  await auth.signInAsSeededUser('rey - Member');

  await expect(page).not.toHaveURL(/login/);
  await page.goto(SUBMISSION_ROUTES_PATHS.BASE);
  // rey's own submissions, which only she sees.
  await expect(page.getByRole('main')).toContainText('Steve Harrington');
  await expect(page.getByRole('main')).toContainText('Wednesday Addams');
});

test('sends a seeded new user from the picker to choose their own password', async ({ page }) => {
  const auth = new AuthPage(page);

  await auth.gotoLogin();
  await auth.signInAsSeededUser('finn - Member (temporary password)');

  await expect(auth.setPasswordHeading).toBeVisible();
});
