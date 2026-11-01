import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { SidebarMenuButton, SidebarMenuItem } from '@components/ui/sidebar';
import { cn } from '@utils/classNameUtils';
import type { NavigationItem } from '@utils/navigationUtils';

type Props = {
  item: NavigationItem;
  isActive: boolean;
  size?: 'default' | 'lg';
  // A name that says more than the visible label ("Notifications, 2 unread"); also the collapsed tooltip.
  accessibleName?: string;
  // Shown after the label (a count); positions itself for the collapsed sidebar.
  badge?: ReactNode;
};

// One sidebar link. The current page is filled with the primary colour; hover on the others stays the quiet grey.
function SidebarNavigationEntry({
  item: { label, to, icon: Icon },
  isActive,
  size = 'default',
  accessibleName,
  badge,
}: Props) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={accessibleName ?? label}
        aria-label={accessibleName}
        render={<NavLink viewTransition to={to} />}
        size={size}
        className={cn(
          'group-data-[collapsible=icon]:justify-center data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-primary-hover data-active:hover:text-sidebar-primary-foreground',
          badge && 'relative',
        )}
      >
        <Icon aria-hidden="true" />
        <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
        {badge}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default SidebarNavigationEntry;
