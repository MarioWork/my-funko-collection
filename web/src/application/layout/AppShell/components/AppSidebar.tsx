import { Settings } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import { APP_NAME, MANAGE_ITEMS, NAVIGATION_ITEMS, type NavigationItem } from '@application/layout/navigationUtils';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppLogo from '@components/AppLogo';
import ThemeToggle from '@components/ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
        render={<NavLink to={to} />}
        size={size}
        className="group-data-[collapsible=icon]:justify-center data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-primary-hover data-active:hover:text-sidebar-primary-foreground"
      >
        <Icon aria-hidden="true" />
        <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

const SETTINGS_ITEM: NavigationItem = { label: 'Settings', to: BASE_ROUTES_PATHS.SETTINGS, icon: Settings };

// Desktop navigation: the four destinations, the two manage pages, then Settings and the theme toggle in the
// footer. Adding lives in the page headers (Funkos, a collection, Home), not here. Collapses to icons from the top-bar toggle, never hides; the edge is not draggable.
function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <Link
          to={BASE_ROUTES_PATHS.HOME}
          aria-label={`${APP_NAME} home`}
          className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo className="group-data-[collapsible=icon]:hidden" />
          <AppLogo isMarkOnly className="hidden group-data-[collapsible=icon]:flex" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-2 p-2">
          {NAVIGATION_ITEMS.map((item) => (
            <NavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} size="lg" />
          ))}
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu className="gap-2 p-2">
          {MANAGE_ITEMS.map((item) => (
            <NavigationEntry key={item.to} item={item} isActive={pathname.startsWith(item.to)} />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-between group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="w-auto">
          <NavigationEntry item={SETTINGS_ITEM} isActive={pathname.startsWith(SETTINGS_ITEM.to)} />
        </SidebarMenu>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
