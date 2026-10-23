import { Link } from 'react-router';
import { APP_NAME } from '@application/layout/navigationUtils';
import AppLogo from '@components/AppLogo';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { SidebarTrigger } from '@components/ui/sidebar';
import MobileMenu from './MobileMenu';

type Props = {
  isDesktop: boolean;
};

// Phone: the ☰ menu and the logo, nothing else (scan is the round Add button). Desktop: the sidebar trigger.
function TopBar({ isDesktop }: Props) {
  if (isDesktop) {
    return (
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <SidebarTrigger />
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur-sm supports-backdrop-filter:bg-card/80">
      <MobileMenu />
      <Link
        viewTransition
        to={BASE_ROUTES_PATHS.HOME}
        aria-label={`${APP_NAME} home`}
        className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AppLogo />
      </Link>
    </header>
  );
}

export default TopBar;
