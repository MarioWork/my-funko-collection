import { ChevronDown, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import IconButton from '@components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@utils/classNameUtils';

export type ViewOption<Value extends string> = {
  value: Value;
  label: string;
  // One line under the label: what this view is good for.
  description: string;
  icon: LucideIcon;
};

type Props<Value extends string> = {
  // What is being chosen: "View", "Layout".
  label: string;
  options: ViewOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

type ItemProps<Value extends string> = {
  option: ViewOption<Value>;
};

function ViewMenuItem<Value extends string>({ option }: ItemProps<Value>) {
  const Icon = option.icon;

  return (
    <DropdownMenuRadioItem value={option.value} className="items-start gap-2.5 py-2">
      <Icon aria-hidden="true" className="mt-0.5 text-muted-foreground" />
      <span className="flex flex-col">
        <span className="font-medium">{option.label}</span>
        <span className="text-xs text-muted-foreground">{option.description}</span>
      </span>
    </DropdownMenuRadioItem>
  );
}

// How a list is shown, in one control: a button with the current view's icon opens a menu of every view, each
// with a line on what it is for, the current one ticked. Takes the room of one button, however many views there are.
function ViewMenu<Value extends string>({ label, options, value, onChange }: Props<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];
  const CurrentIcon = current?.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <IconButton
            variant="outline"
            aria-label={`${label}: ${current?.label ?? ''}`}
            hasTooltip={!isOpen}
            className="w-auto gap-1 border-input bg-card px-2"
          />
        }
      >
        {CurrentIcon ? <CurrentIcon aria-hidden="true" /> : null}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Base UI wants a group label inside its group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={(picked: Value) => onChange(picked)}>
            {options.map((option) => (
              <ViewMenuItem key={option.value} option={option} />
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ViewMenu;
