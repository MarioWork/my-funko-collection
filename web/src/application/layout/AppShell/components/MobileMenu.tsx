import { Menu } from 'lucide-react';
import { useState } from 'react';
import IconButton from '@components/IconButton';
import ThemeSwitcher from '@components/ThemeSwitcher';
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet';
import MobileMenuHeader from './MobileMenuHeader';
import MobileMenuLinks from './MobileMenuLinks';

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
        <MobileMenuHeader />
        <MobileMenuLinks onNavigate={close} />
        <div className="mt-auto flex flex-col gap-2">
          <span className="text-sm font-medium">Theme</span>
          <ThemeSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileMenu;
