import { Link, NavLink, useLocation } from 'react-router';
import {
  ADMIN_GROUP_LABEL,
  ADMIN_ITEMS,
  APP_NAME,
  manageItemsFor,
  NAVIGATION_ITEMS,
  SETTINGS_ITEM,
  type NavigationItem,
} from '@utils/navigationUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppLogo from '@components/AppLogo';
import NotificationBell from './NotificationBell';
import SidebarEdgeToggle from './SidebarEdgeToggle';
import ThemeToggle from './ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@components/ui/sidebar';

type NavigationEntryProps = {
  item: NavigationItem;
  isActive: boolean;
  size?: 'default' | 'lg';
};

// The current page is filled with the primary colour; hover on the others stays the quiet grey.
function NavigationEntry({ item: { label, to, icon: Icon }, isActive, size = 'default' }: NavigationEntryProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        render={<NavLink viewTransition to={to} />}
        size={size}
        className="group-data-[collapsible=icon]:justify-center data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-primary-hover data-active:hover:text-sidebar-primary-foreground"
      >
        <Icon aria-hidden="true" />
        <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

type AdminGroupProps = {
  pathname: string;
};

// The admin's own pages, under an "Admin" label. Members never see this group.
function AdminGroup({ pathname }: AdminGroupProps) {
  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="px-4">{ADMIN_GROUP_LABEL}</SidebarGroupLabel>
      <SidebarMenu aria-label={ADMIN_GROUP_LABEL} className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
        {ADMIN_ITEMS.map((item) => (
          <NavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// The logo (home) and the notification bell beside it; stacked when the sidebar is collapsed to icons.
function SidebarBrand() {
  return (
    <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
      <Link
        viewTransition
        to={BASE_ROUTES_PATHS.HOME}
        aria-label={`${APP_NAME} home`}
        className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AppLogo className="group-data-[collapsible=icon]:hidden" />
        <AppLogo isMarkOnly className="hidden group-data-[collapsible=icon]:flex" />
      </Link>
      <NotificationBell />
    </div>
  );
}

// Desktop navigation: the logo and the notification bell at the top, the four destinations, the manage pages (and a member's Submissions), the Admin group (admins only), then Settings and
// the theme toggle in the footer. Adding lives in the page headers (Funkos, a collection, Home), not here. Collapses to icons from its edge (SidebarEdgeToggle), never hides; the edge is not draggable.
function AppSidebar() {
  const { pathname } = useLocation();
  const isAdmin = useIsAdmin();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
          {NAVIGATION_ITEMS.map((item) => (
            <NavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} size="lg" />
          ))}
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
          {manageItemsFor(isAdmin).map((item) => (
            <NavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} />
          ))}
        </SidebarMenu>
        {isAdmin ? <AdminGroup pathname={pathname} /> : null}
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-between group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="w-auto">
          <NavigationEntry item={SETTINGS_ITEM} isActive={pathname.startsWith(SETTINGS_ITEM.to)} />
        </SidebarMenu>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarEdgeToggle />
    </Sidebar>
  );
}

export default AppSidebar;
