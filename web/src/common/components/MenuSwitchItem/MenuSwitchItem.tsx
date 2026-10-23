import { DropdownMenuCheckboxItem } from '@components/ui/dropdown-menu';
import { cn } from '@utils/classNameUtils';

type Props = {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

// The shadcn item's own tick only appears once checked, so an unticked item reads as plain text. This one hides
// that tick and draws an on/off switch instead, visible in both states. Still a menuitemcheckbox for assistive tech,
// and the menu stays open when it is toggled.
function MenuSwitchItem({ label, isOn, onChange }: Props) {
  return (
    <DropdownMenuCheckboxItem
      checked={isOn}
      onCheckedChange={onChange}
      closeOnClick={false}
      className="gap-3 py-2 pr-2 *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden"
    >
      <span className="flex-1 font-medium">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-[18px] w-8 shrink-0 items-center rounded-full p-px transition-colors',
          isOn ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'size-4 rounded-full bg-background shadow-xs transition-transform',
            isOn ? 'translate-x-3.5' : 'translate-x-0',
          )}
        />
      </span>
    </DropdownMenuCheckboxItem>
  );
}

export default MenuSwitchItem;
