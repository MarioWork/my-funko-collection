import type { ComponentProps, ReactNode } from 'react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  // The browser's passkey prompt is open (or the request around it is running).
  isWaiting: boolean;
  isSupported: boolean;
  // Something else the dialog started is running (a password confirm next to it): off, with the reason.
  isBusy?: boolean;
  // Shown before the label; a spinner takes its place while waiting.
  icon: ReactNode;
  type?: 'button' | 'submit';
  form?: string;
  size?: ComponentProps<typeof Button>['size'];
  // "outline" when it is the second choice next to another button.
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

const WAITING_LABEL = 'Waiting for your passkey…';

type DisabledState = Pick<Props, 'isSupported' | 'isWaiting' | 'isBusy'>;

function disabledReasonOf({ isSupported, isWaiting, isBusy }: DisabledState): string | undefined {
  if (!isSupported) return DISABLED_REASONS.PASSKEY_UNSUPPORTED;

  if (isWaiting) return DISABLED_REASONS.PASSKEY_WAITING;

  if (isBusy) return DISABLED_REASONS.WORKING;

  return undefined;
}

// A button that starts a passkey ceremony: disabled, with the reason, where the browser has no passkeys or while
// its prompt is open, and saying what it waits for meanwhile. Sign in, first run and "Add a passkey" share it.
function PasskeyButton({
  isWaiting,
  isSupported,
  isBusy = false,
  icon,
  type = 'button',
  form,
  size,
  variant,
  className,
  onClick,
  children,
}: Props) {
  const disabledReason = disabledReasonOf({ isSupported, isWaiting, isBusy });

  return (
    <DisabledReason reason={disabledReason}>
      <Button
        type={type}
        form={form}
        size={size}
        variant={variant}
        className={className}
        disabled={disabledReason !== undefined}
        onClick={onClick}
      >
        {isWaiting ? <Spinner data-icon="inline-start" /> : icon}
        {isWaiting ? WAITING_LABEL : children}
      </Button>
    </DisabledReason>
  );
}

export default PasskeyButton;
