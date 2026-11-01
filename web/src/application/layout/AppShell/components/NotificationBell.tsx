import { Link } from 'react-router';
import { NOTIFICATION_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { describeUnreadCount } from '@utils/notificationUtils';
import UnreadCountAwait from './UnreadCountAwait';

// Past this the badge says "99+"; the accessible name keeps the real number.
const MAX_BADGE_COUNT = 99;
const BELL_LABEL = 'Notifications';

const BellIcon = PAGE_ICONS.NOTIFICATIONS;

type BadgeProps = {
  count: number;
};

// The number on the bell. Hidden from screen readers: the link's name already says it in words.
function UnreadBadge({ count }: BadgeProps) {
  const text = count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground ring-2 ring-card"
    >
      {text}
    </span>
  );
}

type BellLinkProps = {
  count: number | undefined;
};

function BellLink({ count }: BellLinkProps) {
  const hasUnread = count !== undefined && count > 0;
  const label = hasUnread ? `${BELL_LABEL}, ${describeUnreadCount(count)}` : BELL_LABEL;

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
      {hasUnread ? <UnreadBadge count={count} /> : null}
    </IconButton>
  );
}

// The bell at the top of the sidebar (desktop) and in the header (phones): a link to the notifications page, with
// the unread count on it. NotificationAnnouncer tells screen readers when the count goes up.
function NotificationBell() {
  return <UnreadCountAwait>{(count) => <BellLink count={count} />}</UnreadCountAwait>;
}

export default NotificationBell;
