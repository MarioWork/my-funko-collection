import { NOTIFICATIONS_ITEM } from '@utils/navigationUtils';
import { describeNotificationsLink, hasUnreadNotifications } from '@utils/notificationUtils';
import SidebarNavigationEntry from './SidebarNavigationEntry';
import UnreadBadge from './UnreadBadge';
import UnreadCountAwait from './UnreadCountAwait';

type Props = {
  isActive: boolean;
};

type EntryProps = Props & {
  count: number | undefined;
};

// At the end of the item, or on the icon's corner when the sidebar is collapsed to icons. On the current page the item
// is filled with the primary colour, so the pill turns the other way round to stay visible.
const BADGE_CLASS =
  'ml-auto group-data-active/menu-button:bg-sidebar-primary-foreground group-data-active/menu-button:text-sidebar-primary group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:text-2xs';

// The name says the count in words ("Notifications, 2 unread"); the pill shows it.
function NotificationsEntry({ isActive, count }: EntryProps) {
  return (
    <SidebarNavigationEntry
      item={NOTIFICATIONS_ITEM}
      isActive={isActive}
      size="lg"
      accessibleName={describeNotificationsLink(count)}
      badge={hasUnreadNotifications(count) ? <UnreadBadge count={count} className={BADGE_CLASS} /> : null}
    />
  );
}

// Desktop's way to the notifications page, after the four destinations; the phones keep the bell in the top bar.
function SidebarNotificationsEntry({ isActive }: Props) {
  return <UnreadCountAwait>{(count) => <NotificationsEntry isActive={isActive} count={count} />}</UnreadCountAwait>;
}

export default SidebarNotificationsEntry;
