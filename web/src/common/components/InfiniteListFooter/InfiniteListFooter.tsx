import { useEffect, useRef } from 'react';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import DisabledReason from '@components/DisabledReason';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';

type Props = {
  shownCount: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  // Plural, for "Showing 60 of 140 funkos".
  noun: string;
  onLoadMore: () => void;
};

// Start fetching a little before the end comes into view, so scrolling rarely has to wait.
const PRELOAD_MARGIN = '800px';

// The end of an infinite list: an invisible marker that loads the next page as it nears the screen, how many are
// shown (read out as it grows), and a "Load more" button for keyboards and screen readers, which never scroll.
function InfiniteListFooter({ shownCount, total, hasMore, isLoading, noun, onLoadMore }: Props) {
  const markerRef = useRef<HTMLDivElement>(null);

  // A DOM subscription, not state: the observer calls the loader when the marker nears the viewport.
  useEffect(() => {
    const marker = markerRef.current;

    if (!marker || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore();
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(marker);

    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <div ref={markerRef} aria-hidden="true" />
      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        {hasMore ? `Showing ${shownCount} of ${total} ${noun}` : `All ${total} ${noun}`}
      </p>
      {hasMore ? (
        <DisabledReason reason={isLoading ? DISABLED_REASONS.LOADING : undefined}>
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? <Spinner data-icon="inline-start" /> : null}
            Load more
          </Button>
        </DisabledReason>
      ) : null}
    </div>
  );
}

export default InfiniteListFooter;
