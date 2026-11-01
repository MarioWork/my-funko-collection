import { cn } from '@utils/classNameUtils';

type Props = {
  count: number;
  // Where it sits: on the bell's corner, or at the end of the sidebar item.
  className?: string;
};

// Past this the badge says "99+"; the accessible name keeps the real number.
const MAX_BADGE_COUNT = 99;

// The unread count as a pill, on the phone bell and the sidebar's Notifications item. Hidden from screen readers:
// the link's name already says it in words.
function UnreadBadge({ count, className }: Props) {
  const text = count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);

  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground',
        className,
      )}
    >
      {text}
    </span>
  );
}

export default UnreadBadge;
