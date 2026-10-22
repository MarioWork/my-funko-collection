import type { LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: LucideIcon;
};

type Props<Value extends string> = {
  label: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  isIconOnly?: boolean;
};

// Two to five exclusive choices (grid | list, comfortable | compact). One always stays selected.
function SegmentedToggle<Value extends string>({ label, options, value, onChange, isIconOnly = false }: Props<Value>) {
  const handleChange = (values: unknown[]) => {
    const [next] = values;

    if (typeof next === 'string' && next !== value) onChange(next as Value);
  };

  return (
    <ToggleGroup value={[value]} onValueChange={handleChange} variant="outline" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const item = (
          <ToggleGroupItem key={optionValue} value={optionValue} aria-label={isIconOnly ? optionLabel : undefined}>
            {Icon ? <Icon aria-hidden="true" /> : null}
            {isIconOnly ? null : optionLabel}
          </ToggleGroupItem>
        );

        // An icon alone needs its name on hover too, not only for assistive tech.
        if (!isIconOnly) return item;

        return (
          <Tooltip key={optionValue}>
            <TooltipTrigger render={item} />
            <TooltipContent>{optionLabel}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}

export default SegmentedToggle;
