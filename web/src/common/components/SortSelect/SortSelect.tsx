import { ArrowDownUp, ArrowDownWideNarrow } from 'lucide-react';
import { SortingDirectionUtil } from '@app-types/utility';
import IconButton from '@components/IconButton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { cn } from '@utils/classNameUtils';

// What the list is sorted by and which way: the URL's sort state.
export type SortOption = {
  field: string;
  direction: SortingDirectionUtil;
};

// The words for the two directions of one field: "A–Z" / "Z–A", "Oldest first" / "Newest first".
export type DirectionLabels = Record<SortingDirectionUtil, string>;

// One field the list can be sorted by. Picking it starts in its natural direction (newest first for dates).
// A field without direction labels (Best match) has one order only.
export type SortField = {
  field: string;
  label: string;
  defaultDirection: SortingDirectionUtil;
  directionLabels?: DirectionLabels;
};

type Props = {
  fields: SortField[];
  field: string;
  direction: SortingDirectionUtil;
  onChange: (option: SortOption) => void;
};

type DirectionButtonProps = {
  sortField: SortField | undefined;
  direction: SortingDirectionUtil;
  onToggle: () => void;
};

const ONE_ORDER_REASON = 'Best match has one order only.';

const OTHER_DIRECTION: Record<SortingDirectionUtil, SortingDirectionUtil> = {
  [SortingDirectionUtil.ASC]: SortingDirectionUtil.DESC,
  [SortingDirectionUtil.DESC]: SortingDirectionUtil.ASC,
};

// One arrow for both directions, flipped upside down for ascending, so a press turns it over instead of swapping it.
const DIRECTION_ICON_CLASS_MAP: Record<SortingDirectionUtil, string> = {
  [SortingDirectionUtil.ASC]: '-scale-y-100',
  [SortingDirectionUtil.DESC]: 'scale-y-100',
};

// Flips the order. Its name says the current order and the one a press gives: "A–Z, switch to Z–A".
function DirectionButton({ sortField, direction, onToggle }: DirectionButtonProps) {
  const labels = sortField?.directionLabels;
  const label = labels ? `${labels[direction]}, switch to ${labels[OTHER_DIRECTION[direction]]}` : 'Order';

  return (
    <IconButton
      variant="outline"
      aria-label={label}
      className="border-input bg-card"
      disabled={!labels}
      disabledReason={ONE_ORDER_REASON}
      onClick={onToggle}
    >
      <ArrowDownWideNarrow
        aria-hidden="true"
        className={cn(
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-standard',
          DIRECTION_ICON_CLASS_MAP[direction],
        )}
      />
    </IconButton>
  );
}

// Sorting as two controls: what to sort by, and an arrow button for which way.
function SortSelect({ fields, field, direction, onChange }: Props) {
  const items = fields.map((option) => ({ value: option.field, label: option.label }));
  const current = fields.find((option) => option.field === field);

  const changeField = (value: string | null) => {
    const picked = fields.find((option) => option.field === value);

    if (picked) onChange({ field: picked.field, direction: picked.defaultDirection });
  };

  const toggleDirection = () => onChange({ field, direction: OTHER_DIRECTION[direction] });

  return (
    <div className="flex items-center gap-1">
      <Select items={items} value={field} onValueChange={changeField}>
        <SelectTrigger aria-label="Sort by" className="min-w-32">
          <ArrowDownUp className="text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <DirectionButton sortField={current} direction={direction} onToggle={toggleDirection} />
    </div>
  );
}

export default SortSelect;
