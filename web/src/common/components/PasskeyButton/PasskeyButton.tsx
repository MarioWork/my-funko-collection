import type { ComponentProps, ReactNode } from 'react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  // The browser's passkey prompt is open (or the request around it is running).
  isWaiting: boolean;
  isSupported: boolean;
  // Shown before the label; a spinner takes its place while waiting.
  icon: ReactNode;
  type?: 'button' | 'submit';
  form?: string;
  size?: ComponentProps<typeof Button>['size'];
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

const WAITING_LABEL = 'Waiting for your passkey…';

function disabledReasonOf(isSupported: boolean, isWaiting: boolean): string | undefined {
  if (!isSupported) return DISABLED_REASONS.PASSKEY_UNSUPPORTED;

  if (isWaiting) return DISABLED_REASONS.PASSKEY_WAITING;

  return undefined;
}

// A button that starts a passkey ceremony: disabled, with the reason, where the browser has no passkeys or while
// its prompt is open, and saying what it waits for meanwhile. Sign in, first run and "Add a passkey" share it.
function PasskeyButton({
  isWaiting,
  isSupported,
  icon,
  type = 'button',
  form,
  size,
  className,
  onClick,
  children,
}: Props) {
  const disabledReason = disabledReasonOf(isSupported, isWaiting);

  return (
    <DisabledReason reason={disabledReason}>
      <Button
        type={type}
        form={form}
        size={size}
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
