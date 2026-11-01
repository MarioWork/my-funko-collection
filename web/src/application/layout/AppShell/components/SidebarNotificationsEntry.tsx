import { NavLink } from 'react-router';
import { SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar';
import { NOTIFICATIONS_ITEM } from '@utils/navigationUtils';
import { describeNotificationsLink } from '@utils/notificationUtils';
import UnreadBadge from './UnreadBadge';
import UnreadCountAwait from './UnreadCountAwait';

type Props = {
  isActive: boolean;
};

type EntryProps = Props & {
  count: number | undefined;
};

const NotificationsIcon = NOTIFICATIONS_ITEM.icon;

// The item itself: the name says the count in words ("Notifications, 2 unread"), the pill shows it at the end, or
// on the icon's corner when the sidebar is collapsed to icons.
function NotificationsEntry({ isActive, count }: EntryProps) {
  const hasUnread = count !== undefined && count > 0;
  const label = describeNotificationsLink(count);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        aria-label={label}
        render={<NavLink viewTransition to={NOTIFICATIONS_ITEM.to} />}
        size="lg"
        className="relative group-data-[collapsible=icon]:justify-center data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-primary-hover data-active:hover:text-sidebar-primary-foreground"
      >
        <NotificationsIcon aria-hidden="true" />
        <span className="group-data-[collapsible=icon]:sr-only">{NOTIFICATIONS_ITEM.label}</span>
        {hasUnread ? (
          <UnreadBadge
            count={count}
            className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:text-[0.625rem]"
          />
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Desktop's way to the notifications page, after the four destinations; the phones keep the bell in the top bar.
function SidebarNotificationsEntry({ isActive }: Props) {
  return <UnreadCountAwait>{(count) => <NotificationsEntry isActive={isActive} count={count} />}</UnreadCountAwait>;
}

export default SidebarNotificationsEntry;
