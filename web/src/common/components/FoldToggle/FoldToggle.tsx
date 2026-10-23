import { ChevronDown } from 'lucide-react';
import { cn } from '@utils/classNameUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';

type Props = {
  headingId: string;
  panelId: string;
  title: string;
  isOpen: boolean;
  // What the folded content holds, shown beside the title while folded.
  summary: string;
  onToggle: () => void;
};

// A card's heading that is also its fold toggle (the WAI-ARIA accordion pattern), with FoldPanel as the content. An
// h3: it sits in a section's list of cards. Folded, the row also shows what the card holds; that line describes the
// button rather than joining the heading's name.
function FoldToggle({ headingId, panelId, title, isOpen, summary, onToggle }: Props) {
  const summaryId = `${headingId}-summary`;

  return (
    <h3 id={headingId} className="min-w-0 flex-1 font-medium">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={isOpen ? undefined : summaryId}
        onClick={onToggle}
        className={cn('flex min-h-6 w-full items-center gap-2 text-left', LINK_FOCUS_CLASS)}
      >
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 transition-transform', !isOpen && '-rotate-90')}
        />
        <span className="shrink-0">{title}</span>
        {isOpen ? null : (
          <span id={summaryId} aria-hidden="true" className="truncate text-sm font-normal text-muted-foreground">
            {summary}
          </span>
        )}
      </button>
    </h3>
  );
}

export default FoldToggle;
