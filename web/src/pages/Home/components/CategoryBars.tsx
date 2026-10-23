import { Link } from 'react-router';
import type { CategoryStatsApiModel } from '@app-types/models';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';

type Props = {
  categories: CategoryStatsApiModel[];
};

const PERCENT = 100;

// Plain horizontal bars, biggest line first; the number sits beside each bar so colour never carries it alone.
function CategoryBars({ categories }: Props) {
  if (categories.length === 0) return null;

  const sorted = [...categories].sort((left, right) => right.funkoCount - left.funkoCount);
  const maxCount = Math.max(...sorted.map((category) => category.funkoCount), 1);

  return (
    <section aria-labelledby="categories-heading" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="categories-heading" className="text-lg font-semibold">
        By category
      </h2>
      <ol className="flex flex-col gap-2">
        {sorted.map((category) => (
          <li key={category.id} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm">
            <Link
              viewTransition
              to={funkosInCategoryPath(category.id)}
              className="truncate underline-offset-4 hover:underline"
            >
              {category.name}
            </Link>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(category.funkoCount / maxCount) * PERCENT}%` }}
              />
            </div>
            <span className="text-muted-foreground tabular-nums">{category.funkoCount}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default CategoryBars;
