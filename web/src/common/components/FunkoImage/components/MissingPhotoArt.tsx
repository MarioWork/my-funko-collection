import { cn } from '@utils/classNameUtils';

type Props = {
  className?: string;
};

// The logo's Pop! figure as a dashed outline, waiting for its photo. Drawn in the theme's muted colour, so it follows
// light and dark mode. Decorative: the tile around it carries the name.
function MissingPhotoArt({ className }: Props) {
  return (
    <svg viewBox="0 0 80 96" fill="none" aria-hidden="true" className={cn('stroke-current', className)}>
      <g strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round">
        <rect x="14" y="8" width="52" height="42" rx="15" />
        <rect x="26" y="54" width="28" height="30" rx="9" />
      </g>
      <g strokeWidth="3" strokeLinecap="round">
        <path d="M14 23a6 6 0 0 0 0 12" />
        <path d="M66 23a6 6 0 0 1 0 12" />
        <path d="M35 37q5 4 10 0" />
      </g>
      <circle cx="30" cy="29" r="4" className="fill-current stroke-none" />
      <circle cx="50" cy="29" r="4" className="fill-current stroke-none" />
    </svg>
  );
}

export default MissingPhotoArt;
