import { Link, useLocation } from 'react-router';
import {
  ADMIN_GROUP_LABEL,
  ADMIN_ITEMS,
  APP_NAME,
  manageItemsFor,
  NAVIGATION_ITEMS,
  NOTIFICATIONS_ITEM,
  SETTINGS_ITEM,
} from '@utils/navigationUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppLogo from '@components/AppLogo';
import SidebarEdgeToggle from './SidebarEdgeToggle';
import SidebarNavigationEntry from './SidebarNavigationEntry';
import SidebarNotificationsEntry from './SidebarNotificationsEntry';
import ThemeToggle from './ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
} from '@components/ui/sidebar';

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
          <SidebarNavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// The logo, a link home.
function SidebarBrand() {
  return (
    <Link
      viewTransition
      to={BASE_ROUTES_PATHS.HOME}
      aria-label={`${APP_NAME} home`}
      className="min-w-0 self-start rounded-md outline-none group-data-[collapsible=icon]:self-center focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AppLogo className="group-data-[collapsible=icon]:hidden" />
      <AppLogo isMarkOnly className="hidden group-data-[collapsible=icon]:flex" />
    </Link>
  );
}

// Desktop navigation: the logo at the top, the four destinations and Notifications (with the unread count), the
// manage pages (and a member's Submissions), a divider and the Admin group (admins only), then Settings and the
// theme toggle in the footer. Adding lives in the page headers (Funkos, a collection, Home), not here. Collapses to icons from its edge (SidebarEdgeToggle), never hides; the edge is not draggable.
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
            <SidebarNavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} size="lg" />
          ))}
          <SidebarNotificationsEntry isActive={pathname.startsWith(NOTIFICATIONS_ITEM.to)} />
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
          {manageItemsFor(isAdmin).map((item) => (
            <SidebarNavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} />
          ))}
        </SidebarMenu>
        {isAdmin ? (
          <>
            <SidebarSeparator />
            <AdminGroup pathname={pathname} />
          </>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-between group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="w-auto">
          <SidebarNavigationEntry item={SETTINGS_ITEM} isActive={pathname.startsWith(SETTINGS_ITEM.to)} />
        </SidebarMenu>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarEdgeToggle />
    </Sidebar>
  );
}

export default AppSidebar;
