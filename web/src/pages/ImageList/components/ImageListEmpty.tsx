import EmptyState from '@components/EmptyState';
import type { FunkoFigurePose } from '@components/FunkoFigureArt';
import { Button } from '@components/ui/button';

type Props = {
  isFiltered: boolean;
  onClearAll: () => void;
};

type EmptyCopy = {
  pose: FunkoFigurePose;
  title: string;
  description: string;
};

const FILTERED_KEY = 'filtered';
const UNFILTERED_KEY = 'unfiltered';

type EmptyKey = typeof FILTERED_KEY | typeof UNFILTERED_KEY;

const EMPTY_COPY_MAP: Record<EmptyKey, EmptyCopy> = {
  [FILTERED_KEY]: {
    pose: 'notFound',
    title: 'No images match',
    description: 'Try another word or clear the filter.',
  },
  [UNFILTERED_KEY]: {
    pose: 'waiting',
    title: 'No images yet',
    description: 'Images you add to funkos show here.',
  },
};

// No rows: either nothing matches the search and filter (with a way out), or nothing is stored yet.
function ImageListEmpty({ isFiltered, onClearAll }: Props) {
  const copy = EMPTY_COPY_MAP[isFiltered ? FILTERED_KEY : UNFILTERED_KEY];

  if (!isFiltered) return <EmptyState {...copy} />;

  return (
    <EmptyState {...copy}>
      <Button variant="outline" onClick={onClearAll}>
        Clear search and filter
      </Button>
    </EmptyState>
  );
}

export default ImageListEmpty;
