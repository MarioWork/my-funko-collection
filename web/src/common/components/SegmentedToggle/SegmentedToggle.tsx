import type { LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: LucideIcon;
};

// "always": icon + text. "never": icon only, which needs icons, with the text as a tooltip.
type LabelDisplay = 'always' | 'never';

type Props<Value extends string> = {
  label: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  labelDisplay?: LabelDisplay;
};

// The option text: hidden visually when it should not show, but still read out, so the button keeps its name.
const LABEL_CLASS_MAP: Record<LabelDisplay, string | undefined> = {
  always: undefined,
  never: 'sr-only',
};

// The chosen option is filled with the primary colour, so it reads as chosen at a glance.
const SELECTED_CLASS =
  'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover aria-pressed:hover:text-primary-foreground';

// Two to five exclusive choices (large grid | small grid | list, light | dark). One always stays selected.
function SegmentedToggle<Value extends string>({
  label,
  options,
  value,
  onChange,
  labelDisplay = 'always',
}: Props<Value>) {
  const isIconOnly = labelDisplay === 'never';

  const handleChange = (values: unknown[]) => {
    const [next] = values;

    if (typeof next === 'string' && next !== value) onChange(next as Value);
  };

  return (
    <ToggleGroup value={[value]} onValueChange={handleChange} variant="outline" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const item = (
          <ToggleGroupItem key={optionValue} value={optionValue} className={SELECTED_CLASS}>
            {Icon ? <Icon aria-hidden="true" /> : null}
            <span className={LABEL_CLASS_MAP[labelDisplay]}>{optionLabel}</span>
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
