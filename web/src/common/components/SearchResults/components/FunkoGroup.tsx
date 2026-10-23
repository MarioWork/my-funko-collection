import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { SuggestApiModel } from '@app-types/models';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { allFunkosPath, RESULT_LINK_CLASS } from '../searchResultsUtils';

type Props = {
  query: string;
  funkos: SuggestApiModel['funkos'];
  onPick?: () => void;
};

const THUMB_SIZES = '40px';

// The heading carries the way into the full catalog search; the list below is only the first few hits.
function FunkoGroup({ query, funkos, onPick }: Props) {
  return (
    <section aria-label="Funkos" className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-2">
        <h2 className="text-xs font-medium text-muted-foreground uppercase">Funkos</h2>
        <Link
          viewTransition
          to={allFunkosPath(query)}
          onClick={onPick}
          className="flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          All funkos matching &ldquo;{query}&rdquo;
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      {funkos.length === 0 ? <p className="px-2 py-1.5 text-sm text-muted-foreground">No funko matches here.</p> : null}
      <ul className="flex flex-col">
        {funkos.map((funko) => (
          <li key={funko.id}>
            <Link
              viewTransition
              to={FUNKO_ROUTES_PATHS.detail(String(funko.id))}
              onClick={onPick}
              className={RESULT_LINK_CLASS}
            >
              <FunkoImage image={funko.primaryImage} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-8 rounded-sm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{funko.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  #{funko.number} · {funko.category.name}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FunkoGroup;
