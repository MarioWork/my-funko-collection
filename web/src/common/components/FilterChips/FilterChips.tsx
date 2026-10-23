import { X } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { cn } from '@utils/classNameUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';

export type FilterChip = {
  key: string;
  // "Category: Pop! Marvel": the type is spelled out because a bare value can be ambiguous.
  label: string;
  onRemove: () => void;
};

type Props = {
  chips: FilterChip[];
  onClearAll: () => void;
};

// The applied filters, each removable, with "Clear all"; scrolls sideways on narrow screens. A new chip grows in.
function FilterChips({ chips, onClearAll }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className={cn('flex scrollbar-none items-center gap-2 overflow-x-auto pb-1', FADE_IN_CLASS)}>
      <ul className="flex items-center gap-2" aria-label="Applied filters">
        {chips.map((chip) => (
          <li key={chip.key} className={cn(FADE_IN_CLASS, 'motion-safe:zoom-in-90')}>
            <Badge
              variant="secondary"
              render={<button type="button" onClick={chip.onRemove} aria-label={`Remove filter ${chip.label}`} />}
              className="h-7 gap-1 pr-1.5 pl-2.5 text-sm"
            >
              {chip.label}
              <X aria-hidden="true" />
            </Badge>
          </li>
        ))}
      </ul>
      <Button variant="link" size="sm" onClick={onClearAll} className="shrink-0">
        Clear all
      </Button>
    </div>
  );
}

export default FilterChips;
