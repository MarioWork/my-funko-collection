import type { ComponentProps } from 'react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@utils/classNameUtils';

type Props = Omit<ComponentProps<typeof Button>, 'size' | 'aria-label'> & {
  // Required: an icon-only control has no visible text to name it. It is also the tooltip.
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  // Off for a button whose meaning is obvious from where it sits, or that already carries another popup.
  hasTooltip?: boolean;
  // Why it is disabled; shown in the tooltip instead of the label while `disabled` is on.
  disabledReason?: string;
};

const SIZE_MAP: Record<NonNullable<Props['size']>, ComponentProps<typeof Button>['size']> = {
  sm: 'icon-sm',
  md: 'icon',
  lg: 'icon-lg',
};

// A shadcn icon button with a 44 px touch target on coarse pointers (WCAG 2.2 target size, Apple's minimum) and
// a tooltip that says what the icon means, for the mouse users who cannot see the accessible name.
function IconButton({
  size = 'md',
  className,
  hasTooltip = true,
  disabledReason,
  'aria-label': label,
  ...props
}: Props) {
  const button = (
    <Button
      size={SIZE_MAP[size]}
      aria-label={label}
      className={cn('pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-2', className)}
      {...props}
    />
  );

  if (props.disabled && disabledReason) return <DisabledReason reason={disabledReason}>{button}</DisabledReason>;

  if (!hasTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default IconButton;
