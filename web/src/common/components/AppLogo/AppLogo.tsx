import { cn } from '@utils/classNameUtils';
import logoFace from './logoFace.png';

type Props = {
  // The mark only (the collapsed sidebar); the wordmark follows it otherwise.
  isMarkOnly?: boolean;
  className?: string;
};

// Mark + wordmark, as in the brand artwork: the Pop! face (cut from the artwork with a clear background), then one
// word with "Funko" in the brand colour. The face is decorative: the link around the logo carries the name.
function AppLogo({ isMarkOnly = false, className }: Props) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <img src={logoFace} alt="" className="h-8 w-auto max-w-full shrink-0 object-contain" />
      {isMarkOnly ? null : (
        <span className="truncate text-lg font-extrabold tracking-tight">
          My<span className="text-primary">Funko</span>Collection
        </span>
      )}
    </span>
  );
}

export default AppLogo;
