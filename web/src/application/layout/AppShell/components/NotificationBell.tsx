import { Link } from 'react-router';
import { NOTIFICATION_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { describeNotificationsLink } from '@utils/notificationUtils';
import UnreadBadge from './UnreadBadge';
import UnreadCountAwait from './UnreadCountAwait';

const BellIcon = PAGE_ICONS.NOTIFICATIONS;

type BellLinkProps = {
  count: number | undefined;
};

function BellLink({ count }: BellLinkProps) {
  const hasUnread = count !== undefined && count > 0;
  const label = describeNotificationsLink(count);

  return (
    <IconButton
      variant="ghost"
      aria-label={label}
      render={<Link viewTransition to={NOTIFICATION_ROUTES_PATHS.BASE} />}
      nativeButton={false}
      role="link"
      className="relative"
    >
      <BellIcon aria-hidden="true" />
      {hasUnread ? <UnreadBadge count={count} className="absolute -top-1 -right-1 ring-2 ring-card" /> : null}
    </IconButton>
  );
}

// The bell in the phones' top bar (desktop has the sidebar's Notifications item instead): a link to the notifications page, with
// the unread count on it. NotificationAnnouncer tells screen readers when the count goes up.
function NotificationBell() {
  return <UnreadCountAwait>{(count) => <BellLink count={count} />}</UnreadCountAwait>;
}

export default NotificationBell;
