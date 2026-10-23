import type { CategoryStatsApiModel } from '@app-types/models';
import CategoryBar from './CategoryBar';

type Props = {
  categories: CategoryStatsApiModel[];
};

const HEADING_ID = 'categories-heading';

// Plain horizontal bars, biggest line first; the number sits beside each bar so colour never carries it alone.
function CategoryBars({ categories }: Props) {
  if (categories.length === 0) return null;

  const sorted = [...categories].sort((left, right) => right.funkoCount - left.funkoCount);
  const maxCount = Math.max(...sorted.map((category) => category.funkoCount), 1);

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id={HEADING_ID} className="text-lg font-semibold">
        By category
      </h2>
      <ol className="flex flex-col gap-2">
        {sorted.map((category) => (
          <CategoryBar key={category.id} category={category} maxCount={maxCount} />
        ))}
      </ol>
    </section>
  );
}

export default CategoryBars;
