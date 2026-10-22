import { SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { useIsDesktop } from '@hooks/useMediaQuery';

type Props = {
  activeCount: number;
  resultCount: number;
  children: ReactNode;
};

type TriggerProps = {
  activeCount: number;
  isOpen: boolean;
  onClick?: () => void;
};

function FilterTrigger({ activeCount, isOpen, onClick }: TriggerProps) {
  return (
    <Button variant="outline" aria-expanded={isOpen} onClick={onClick}>
      <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
      Filters
      {activeCount > 0 ? <Badge className="ml-1">{activeCount}</Badge> : null}
    </Button>
  );
}

type DrawerBodyProps = {
  resultCount: number;
  onClose: () => void;
  children: ReactNode;
};

function FilterDrawerBody({ resultCount, onClose, children }: DrawerBodyProps) {
  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Filters</DrawerTitle>
        <DrawerDescription>{resultCount} results</DrawerDescription>
      </DrawerHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">{children}</div>
      <div className="border-t p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <Button className="w-full" onClick={onClose}>
          Show {resultCount} results
        </Button>
      </div>
    </DrawerContent>
  );
}

// "Filters (n)": a bottom drawer on phones, a popover on desktop. Filters apply at once; closing just closes.
function FilterPanel({ activeCount, resultCount, children }: Props) {
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={<FilterTrigger activeCount={activeCount} isOpen={isOpen} />} />
        <PopoverContent align="end" className="w-80">
          <div className="flex flex-col gap-4">{children}</div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <FilterTrigger activeCount={activeCount} isOpen={isOpen} onClick={() => setIsOpen(true)} />
      <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
        <FilterDrawerBody resultCount={resultCount} onClose={() => setIsOpen(false)}>
          {children}
        </FilterDrawerBody>
      </Drawer>
    </>
  );
}

export default FilterPanel;
