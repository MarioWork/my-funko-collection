import type { ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';

type Props = {
  id: string;
  isOpen: boolean;
  children: ReactNode;
};

// Folds its content smoothly: the grid row eases between 0fr and 1fr, so the height animates without measuring it.
// Folded content stays mounted (typed values are kept) but is inert: out of the tab order and the screen reader.
function FoldPanel({ id, isOpen, children }: Props) {
  return (
    <div
      id={id}
      inert={!isOpen}
      className={cn(
        'grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-200 motion-safe:ease-out',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export default FoldPanel;
