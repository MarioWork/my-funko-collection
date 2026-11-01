import { useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import EmptyState from '@components/EmptyState';
import PageHeader from '@components/PageHeader';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { describeNewNotifications } from '@utils/notificationUtils';
import MarkAllReadButton from './components/MarkAllReadButton';
import NotificationItem from './components/NotificationItem';
import type { loader } from './notificationListLoader';

const PAGE_TITLE = 'Notifications';
const ALL_READ_DESCRIPTION = 'All read.';
const LIST_LABEL = 'Your notifications';
const RETENTION_NOTE = 'Notifications are kept for 90 days.';
const EMPTY_TITLE = 'No notifications';
const EMPTY_DESCRIPTION =
  'You hear here when something happens to you: a funko you sent in is approved or rejected, or, for admins, a new submission waits.';

// The signed-in user's notifications, newest first. Opening one marks it read and goes to what it is about.
function NotificationList() {
  const { notificationsResponse } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const notifications = notificationsResponse.data;
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const hasNotifications = notifications.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.NOTIFICATIONS}
        title={PAGE_TITLE}
        description={unreadCount > 0 ? describeNewNotifications(unreadCount) : ALL_READ_DESCRIPTION}
        actions={hasNotifications ? <MarkAllReadButton hasUnread={unreadCount > 0} /> : null}
      />
      {hasNotifications ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-2">
          <ul aria-label={LIST_LABEL} className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </ul>
          <p className="pb-2 text-xs text-muted-foreground">{RETENTION_NOTE}</p>
        </div>
      ) : (
        <EmptyState pose="waiting" title={EMPTY_TITLE} description={EMPTY_DESCRIPTION} />
      )}
    </div>
  );
}

export default NotificationList;
