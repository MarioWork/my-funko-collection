import { Menu, Settings } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { MANAGE_ITEMS, type NavigationItem } from '@application/layout/navigationUtils';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import AppLogo from '@components/AppLogo';
import IconButton from '@components/IconButton';
import ThemeSwitcher from '@components/ThemeSwitcher';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { cn } from '@utils/classNameUtils';

const MENU_ITEMS: NavigationItem[] = [
  ...MANAGE_ITEMS,
  { label: 'Settings', to: BASE_ROUTES_PATHS.SETTINGS, icon: Settings },
];

type MenuLinkProps = {
  item: NavigationItem;
  onNavigate: () => void;
};

function MenuLink({ item: { label, to, icon: Icon }, onNavigate }: MenuLinkProps) {
  return (
    <NavLink
      viewTransition
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-lg px-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

// The phone's ☰: everything the four bottom tabs leave out (categories, tags, settings) and the theme. A link
// closes the panel as it navigates.
function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={<IconButton aria-label="Menu" variant="ghost" hasTooltip={false} />}>
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="gap-6 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetHeader className="p-0">
          <SheetTitle>
            <AppLogo />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="More">
          <ul className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <li key={item.to}>
                <MenuLink item={item} onNavigate={close} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <span className="text-sm font-medium">Theme</span>
          <ThemeSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileMenu;
