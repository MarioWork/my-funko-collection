import AppLogo from '@components/AppLogo';
import { SheetHeader, SheetTitle } from '@components/ui/sheet';

function MobileMenuHeader() {
  return (
    <SheetHeader className="p-0">
      <SheetTitle>
        <AppLogo />
      </SheetTitle>
    </SheetHeader>
  );
}

export default MobileMenuHeader;
