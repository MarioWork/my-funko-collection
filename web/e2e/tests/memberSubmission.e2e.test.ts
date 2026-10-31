import path from 'node:path';
import { UserRoleUtil } from '@app-types/utility';
import { expect, test } from '../fixtures/app.fixture';
import { AddPage } from '../pages/AddPage.page';
import { SubmissionsPage } from '../pages/SubmissionsPage.page';

const PHOTO = path.join(import.meta.dirname, '../fixtures/photos', 'front.png');

test.use({ userRole: UserRoleUtil.MEMBER });

test('a member sends a new funko in: it waits for an admin and shows on their Submissions page', async ({ page }) => {
  const add = new AddPage(page);
  const submissions = new SubmissionsPage(page);

  await add.gotoManual();
  await add.fillDetails({ name: 'Member Pop', number: '777', categoryName: 'Pop! Games' });
  await add.choosePhotos([PHOTO]);
  await add.save();

  await expect(add.savedCard).toContainText('Member Pop');
  await expect(add.savedCard).toContainText('Saved to Owned.');
  await expect(add.savedCard).toContainText('only you see it until an admin approves it');

  await submissions.goto();

  await expect(submissions.heading).toBeVisible();
  await expect(submissions.row('Member Pop')).toContainText('Waiting');
});
