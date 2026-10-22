import { ArrowDownUp } from 'lucide-react';
import { SortingDirectionUtil } from '@app-types/utility';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

export type SortOption = {
  field: string;
  direction: SortingDirectionUtil;
  label: string;
};

type Props = {
  options: SortOption[];
  field: string;
  direction: SortingDirectionUtil;
  onChange: (option: SortOption) => void;
  label?: string;
};

const SEPARATOR = ':';

function toValue({ field, direction }: Pick<SortOption, 'field' | 'direction'>): string {
  return `${field}${SEPARATOR}${direction}`;
}

// Field and direction in one control: "Name A–Z", "Newest first".
function SortSelect({ options, field, direction, onChange, label = 'Sort' }: Props) {
  const items = options.map((option) => ({ value: toValue(option), label: option.label }));
  const current = toValue({ field, direction });

  const handleChange = (value: string | null) => {
    const option = options.find((candidate) => toValue(candidate) === value);

    if (option) onChange(option);
  };

  return (
    <Select items={items} value={current} onValueChange={handleChange}>
      <SelectTrigger aria-label={label} className="min-w-36">
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
  );
}

export default SortSelect;
