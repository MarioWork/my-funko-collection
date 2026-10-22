import { cn } from '@utils/classNameUtils';

type Props = {
  // The mark only (the collapsed sidebar); the wordmark follows it otherwise.
  isMarkOnly?: boolean;
  className?: string;
};

// A Pop! figure: the oversized round head with two dot eyes on a small body, on the brand square. Drawn with the
// theme tokens so it follows light and dark mode.
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <circle cx="32" cy="25" r="15" className="fill-primary-foreground" />
      <rect x="21" y="41" width="22" height="15" rx="6" className="fill-primary-foreground" />
      <rect x="27" y="37" width="10" height="7" className="fill-primary-foreground" />
      <circle cx="26.5" cy="24" r="2.6" className="fill-primary" />
      <circle cx="37.5" cy="24" r="2.6" className="fill-primary" />
    </svg>
  );
}

// Mark + wordmark. "MyFunko" carries the weight, "Collection" the brand colour; one word, as Mario wrote it.
function AppLogo({ isMarkOnly = false, className }: Props) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      {isMarkOnly ? null : (
        <span className="truncate text-xl font-bold tracking-tight">
          MyFunko
          <span className="font-semibold text-primary">Collection</span>
        </span>
      )}
    </span>
  );
}

export default AppLogo;
