import { expect, test } from '../fixtures/app.fixture';
import { NotificationsPage } from '../pages/NotificationsPage.page';
import { SubmissionReviewPage } from '../pages/SubmissionReviewPage.page';

// The mock seed tells the admin of each member's submission; the oldest (Thanos) is read already.
const NEWEST_SUBMISSION = 'New submission: Bluey';

test('an admin follows the notifications link to a new submission, then marks the rest read', async ({ page }) => {
  const notifications = new NotificationsPage(page);
  const review = new SubmissionReviewPage(page);

  await notifications.gotoHome();
  await expect(notifications.notificationsLink('Notifications, 2 unread')).toBeVisible();

  await notifications.openFromNotificationsLink();
  await expect(notifications.heading).toBeVisible();
  await expect(page.getByText('2 unread notifications')).toBeVisible();

  await notifications.open(NEWEST_SUBMISSION);
  await expect(review.heading).toBeVisible();
  await expect(notifications.notificationsLink('Notifications, 1 unread')).toBeVisible();

  await notifications.openFromNotificationsLink();
  await notifications.markAllRead();

  await expect(page.getByText('All read.')).toBeVisible();
  await expect(notifications.notificationsLink('Notifications')).toBeVisible();
});
