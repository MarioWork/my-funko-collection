import { SlidersHorizontal } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import IconButton from '@components/IconButton';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { cn } from '@utils/classNameUtils';

type Props = {
  activeCount: number;
  resultCount: number;
  children: ReactNode;
};

type TriggerProps = Omit<ComponentProps<typeof IconButton>, 'aria-label' | 'children'> & {
  activeCount: number;
  isOpen: boolean;
};

// An outlined white icon button like its neighbours, named and tooltipped "Filters"; a small count when some are on.
// Extra props are the popover trigger's own (ref, handlers), passed straight through.
function FilterTrigger({ activeCount, isOpen, className, ...props }: TriggerProps) {
  const hasActive = activeCount > 0;

  return (
    <IconButton
      variant="outline"
      aria-label={hasActive ? `Filters, ${activeCount} on` : 'Filters'}
      aria-expanded={isOpen}
      className={cn('relative border-input bg-card', className)}
      {...props}
    >
      <SlidersHorizontal aria-hidden="true" />
      {hasActive ? (
        <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[0.65rem]" aria-hidden="true">
          {activeCount}
        </Badge>
      ) : null}
    </IconButton>
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

// The filters icon (with a count): a bottom drawer on phones, a popover on desktop. Filters apply at once; closing just closes.
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
