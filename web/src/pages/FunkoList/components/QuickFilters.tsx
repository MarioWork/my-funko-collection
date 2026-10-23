import { Toggle } from '@components/ui/toggle';
import type { FunkoFilterField } from '../hooks/useFunkoListParams';
import type { QuickFilter } from '../funkoListUtils';

type Props = {
  quickFilters: QuickFilter[];
  filters: Record<FunkoFilterField, string | undefined>;
  onChange: (field: FunkoFilterField, value: string | undefined) => void;
};

// One tap for the filters used most, right under the search. Each chip is a pressed / not pressed button; the rest
// of the filters stay in the panel. Scrolls sideways on narrow screens.
function QuickFilters({ quickFilters, filters, onChange }: Props) {
  return (
    <ul aria-label="Quick filters" className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1">
      {quickFilters.map(({ key, label, field, value }) => (
        <li key={key} className="shrink-0">
          <Toggle
            variant="outline"
            size="sm"
            pressed={filters[field] === value}
            onPressedChange={(isPressed) => onChange(field, isPressed ? value : undefined)}
            className="rounded-full px-3 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {label}
          </Toggle>
        </li>
      ))}
    </ul>
  );
}

export default QuickFilters;
