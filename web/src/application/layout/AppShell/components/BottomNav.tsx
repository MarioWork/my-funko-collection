import { NavLink } from 'react-router';
import { NAVIGATION_ITEMS } from '@application/layout/navigationUtils';
import { cn } from '@utils/classNameUtils';

// Four tabs, labels always on, never hidden on scroll. Height is --bottom-nav-height plus the iOS safe area.
function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm supports-backdrop-filter:bg-card/80 lg:hidden"
    >
      <ul className="grid h-(--bottom-nav-height) grid-cols-4">
        {NAVIGATION_ITEMS.map(({ label, to, icon: Icon }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default BottomNav;
