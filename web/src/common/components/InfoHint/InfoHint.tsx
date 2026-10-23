import { Info } from 'lucide-react';
import IconButton from '@components/IconButton';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';

type Props = {
  // The button's accessible name, e.g. "About collections".
  label: string;
  children: React.ReactNode;
};

// A small "i" beside a label that opens a short explanation. A popover, not a tooltip, so a tap opens it on a phone.
function InfoHint({ label, children }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton aria-label={label} hasTooltip={false} size="sm" variant="ghost" className="text-muted-foreground">
            <Info aria-hidden="true" />
          </IconButton>
        }
      />
      <PopoverContent align="start">{children}</PopoverContent>
    </Popover>
  );
}

export default InfoHint;
