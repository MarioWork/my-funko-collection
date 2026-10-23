import { Link } from 'react-router';
import type { CategoryStatsApiModel } from '@app-types/models';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';

type Props = {
  category: CategoryStatsApiModel;
  // The biggest category's count: its bar is the full width.
  maxCount: number;
};

const PERCENT = 100;

// One category: its name (a link to its funkos), the bar, then the count beside it.
function CategoryBar({ category, maxCount }: Props) {
  return (
    <li className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm">
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
  );
}

export default CategoryBar;
