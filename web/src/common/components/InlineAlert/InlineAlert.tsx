import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';
import { FADE_IN_CLASS } from '@utils/motionUtils';

type Props = {
  tone: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
};

const TONE_CLASS_MAP: Record<Props['tone'], string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-border bg-muted text-foreground',
};

const TONE_ICON_MAP: Record<Props['tone'], typeof Info> = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

// Errors are `role="alert"` (announced at once); the rest is `role="status"` (announced when idle).
function InlineAlert({ tone, children, className }: Props) {
  const Icon = TONE_ICON_MAP[tone];
  const role = tone === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        FADE_IN_CLASS,
        'motion-safe:slide-in-from-top-1',
        TONE_CLASS_MAP[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default InlineAlert;
