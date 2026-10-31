import {
  ADMIN_GROUP_LABEL,
  ADMIN_ITEMS,
  manageItemsFor,
  SETTINGS_ITEM,
  type NavigationItem,
} from '@utils/navigationUtils';
import { useId } from 'react';
import { useIsAdmin } from '@hooks/useIsAdmin';
import MobileMenuLink from './MobileMenuLink';

type Props = {
  onNavigate: () => void;
};

type LinkListProps = {
  items: NavigationItem[];
  onNavigate: () => void;
};

function LinkList({ items, onNavigate }: LinkListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.to}>
          <MobileMenuLink item={item} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

// The manage pages (and a member's Submissions) and Settings, then the Admin group for an admin.
function MobileMenuLinks({ onNavigate }: Props) {
  const isAdmin = useIsAdmin();
  const adminHeadingId = useId();

  return (
    <nav aria-label="More" className="flex flex-col gap-3">
      <LinkList items={[...manageItemsFor(isAdmin), SETTINGS_ITEM]} onNavigate={onNavigate} />
      {isAdmin ? (
        <section aria-labelledby={adminHeadingId} className="flex flex-col gap-1">
          <h2 id={adminHeadingId} className="px-3 text-xs font-medium text-muted-foreground">
            {ADMIN_GROUP_LABEL}
          </h2>
          <LinkList items={ADMIN_ITEMS} onNavigate={onNavigate} />
        </section>
      ) : null}
    </nav>
  );
}

export default MobileMenuLinks;
