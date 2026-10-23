import { NavLink } from 'react-router';
import { cn } from '@utils/classNameUtils';
import type { NavigationItem } from '@utils/navigationUtils';

type Props = {
  item: NavigationItem;
  onNavigate: () => void;
};

function MobileMenuLink({ item: { label, to, icon: Icon }, onNavigate }: Props) {
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

export default MobileMenuLink;
