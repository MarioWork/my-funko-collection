import type { LucideIcon } from 'lucide-react';
import DisabledReason from '@components/DisabledReason';
import { DropdownMenuItem } from '@components/ui/dropdown-menu';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  label: string;
  icon: LucideIcon;
  isDisabled: boolean;
  // Why the item is disabled, shown in a tooltip while it is.
  disabledReason: string;
  onClick: () => void;
};

// A menu item that can be disabled, with its reason in a tooltip.
function DisabledMenuItem({ label, icon: Icon, isDisabled, disabledReason, onClick }: Props) {
  return (
    <DisabledReason reason={reasonWhen(isDisabled, disabledReason)} mode="wrapper" wrapperClassName="block">
      <DropdownMenuItem disabled={isDisabled} onClick={onClick}>
        <Icon aria-hidden="true" />
        {label}
      </DropdownMenuItem>
    </DisabledReason>
  );
}

export default DisabledMenuItem;
