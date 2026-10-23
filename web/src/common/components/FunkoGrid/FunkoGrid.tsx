import type { ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';

type Props = {
  // The list's accessible name: "Funkos", "Recently added".
  label: string;
  density?: 'comfortable' | 'compact';
  children: ReactNode;
};

// Columns follow the container (the content pane), not the viewport: 2 → 3 → 4 → 6 as the pane widens. Rows get
// more than the column gap, so a card's caption reads as its own and not as the top of the photo below.
const DENSITY_CLASS_MAP: Record<NonNullable<Props['density']>, string> = {
  comfortable: 'grid-cols-2 gap-x-5 gap-y-12 @md:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6',
  compact: 'grid-cols-3 gap-x-3 gap-y-8 @md:grid-cols-4 @3xl:grid-cols-6 @5xl:grid-cols-8',
};

function FunkoGrid({ label, density = 'comfortable', children }: Props) {
  return (
    <ul aria-label={label} className={cn('grid list-none', DENSITY_CLASS_MAP[density])}>
      {children}
    </ul>
  );
}

export default FunkoGrid;
