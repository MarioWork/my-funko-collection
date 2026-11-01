import { expect, test } from '../fixtures/app.fixture';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';
import { NotificationsPage } from '../pages/NotificationsPage.page';

// The mock seed tells the admin of each member's submission; the oldest (Thanos) is read already.
const NEWEST_SUBMISSION_NAME = 'Bluey';
const NEWEST_SUBMISSION = `New submission: ${NEWEST_SUBMISSION_NAME}`;

test('an admin follows the notifications link to a new submission, then marks the rest read', async ({ page }) => {
  const notifications = new NotificationsPage(page);
  const funkoDetail = new FunkoDetailPage(page);

  await notifications.gotoHome();
  await expect(notifications.notificationsLink('Notifications, 2 unread')).toBeVisible();

  await notifications.openFromNotificationsLink();
  await expect(notifications.heading).toBeVisible();
  await expect(page.getByText('2 unread notifications')).toBeVisible();

  await notifications.open(NEWEST_SUBMISSION);
  await expect(funkoDetail.title).toHaveText(NEWEST_SUBMISSION_NAME);
  await expect(notifications.notificationsLink('Notifications, 1 unread')).toBeVisible();

  await notifications.openFromNotificationsLink();
  await notifications.markAllRead();

  await expect(page.getByText('All read.')).toBeVisible();
  await expect(notifications.notificationsLink('Notifications')).toBeVisible();
});
