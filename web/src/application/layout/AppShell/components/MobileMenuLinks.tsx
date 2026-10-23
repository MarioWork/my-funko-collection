import { MANAGE_ITEMS, SETTINGS_ITEM, type NavigationItem } from '@utils/navigationUtils';
import MobileMenuLink from './MobileMenuLink';

type Props = {
  onNavigate: () => void;
};

const MENU_ITEMS: NavigationItem[] = [...MANAGE_ITEMS, SETTINGS_ITEM];

function MobileMenuLinks({ onNavigate }: Props) {
  return (
    <nav aria-label="More">
      <ul className="flex flex-col gap-1">
        {MENU_ITEMS.map((item) => (
          <li key={item.to}>
            <MobileMenuLink item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MobileMenuLinks;
