import { cloneElement, useId, useRef, useState, type ReactElement } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';

type DisableableControl = ReactElement<{ focusableWhenDisabled?: boolean; 'aria-describedby'?: string }>;

type Props = {
  // Why the control is disabled. Pass it only while it is disabled; without one the control renders untouched.
  reason: string | undefined;
  // "button": a Base UI Button (the shadcn Button and IconButton). It stays hoverable and focusable while disabled,
  // so the tooltip opens on hover and on keyboard focus. "wrapper": anything else (menu item, switch, native
  // control); a span around it carries the tooltip on hover.
  mode?: 'button' | 'wrapper';
  // Wrapper mode only: how the span sits in its layout ("block" for a menu item, "flex w-full" for a full-width box).
  wrapperClassName?: string;
  children: DisableableControl;
};

// Phones have no hover: a tap opens the reason, and it closes by itself after this long.
const TAP_REASON_MS = 2500;

// Every disabled control says why: a tooltip on hover, keyboard focus and tap, and the same text as a description
// for screen readers.
function DisabledReason({ reason, mode = 'button', wrapperClassName = 'inline-flex max-w-full', children }: Props) {
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  // Until when a tap keeps the reason open: the tap itself also reads as a press outside, which would close it.
  const tapOpenUntil = useRef(0);

  if (!reason) return children;

  const openOnTap = () => {
    window.clearTimeout(closeTimer.current);
    tapOpenUntil.current = Date.now() + TAP_REASON_MS;
    setIsOpen(true);
    closeTimer.current = window.setTimeout(() => setIsOpen(false), TAP_REASON_MS);
  };

  const changeOpen = (isNextOpen: boolean) => {
    const isHeldByTap = Date.now() < tapOpenUntil.current;

    if (!isNextOpen && isHeldByTap) return;

    setIsOpen(isNextOpen);
  };

  const description = (
    <span id={descriptionId} hidden>
      {reason}
    </span>
  );
  if (mode === 'wrapper') {
    // A real box, so it can take the hover the disabled control cannot; it also catches the tap.
    return (
      <Tooltip open={isOpen} onOpenChange={changeOpen}>
        <TooltipTrigger render={<span className={wrapperClassName} onClickCapture={openOnTap} />}>
          {cloneElement(children, { 'aria-describedby': descriptionId })}
          {description}
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    // The tap is caught on the way down, before the disabled button swallows it; `contents` leaves the layout alone.
    <span className="contents" onClickCapture={openOnTap}>
      <Tooltip open={isOpen} onOpenChange={changeOpen}>
        <TooltipTrigger
          render={cloneElement(children, { focusableWhenDisabled: true, 'aria-describedby': descriptionId })}
        />
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      {description}
    </span>
  );
}

export default DisabledReason;
