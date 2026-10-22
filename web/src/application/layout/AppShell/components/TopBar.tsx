import { ScanBarcode } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { APP_NAME } from '@application/layout/navigationUtils';
import AppLogo from '@components/AppLogo';
import { ADD_ROUTES_PATHS, BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import IconButton from '@components/IconButton';
import ThemeToggle from '@components/ThemeToggle';
import { SidebarTrigger } from '@components/ui/sidebar';

type Props = {
  isDesktop: boolean;
};

// Phone: title, scan shortcut, theme toggle. Desktop: the sidebar trigger; the sidebar footer owns the toggle.
function TopBar({ isDesktop }: Props) {
  const { pathname } = useLocation();
  const isOnAddFlow = pathname.startsWith(ADD_ROUTES_PATHS.BASE);

  if (isDesktop) {
    return (
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <SidebarTrigger />
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-card/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-card/80">
      <Link
        to={BASE_ROUTES_PATHS.HOME}
        aria-label={`${APP_NAME} home`}
        className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AppLogo />
      </Link>
      <div className="flex items-center gap-1">
        {isOnAddFlow ? null : (
          <IconButton
            variant="ghost"
            aria-label="Scan a barcode"
            render={<Link to={ADD_ROUTES_PATHS.BASE} />}
            nativeButton={false}
          >
            <ScanBarcode aria-hidden="true" />
          </IconButton>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

export default TopBar;
