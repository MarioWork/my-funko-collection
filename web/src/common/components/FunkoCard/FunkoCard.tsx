import { Link } from 'react-router';
import type { FunkoApiModel, FunkoSummaryApiModel } from '@app-types/models';
import { FUNKO_MATCH_FIELD_LABELS, FunkoGridDensityUtil, FunkoMatchFieldUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';

// A funko summary, plus what a search hit or a collection list adds to it.
type FunkoCardFunko = FunkoSummaryApiModel & Partial<Pick<FunkoApiModel, 'matchedOn' | 'collections'>>;

type Props = {
  funko: FunkoCardFunko;
  quantity?: number;
  density?: FunkoGridDensityUtil;
};

// A hit on the name or the id is obvious from the card itself, so the caption leaves those out.
const SELF_EVIDENT_MATCHES: FunkoMatchFieldUtil[] = [FunkoMatchFieldUtil.NAME, FunkoMatchFieldUtil.ID];

// Tile widths per grid column count; the browser picks the size from this.
const CARD_SIZES = '(min-width: 1536px) 15vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw';

// Image first, two badges at most, the whole card is the link. Matched-by caption only when a search hit it. Hover
// and keyboard focus outline the photo in the primary colour, like the collection cards.
function FunkoCard({ funko, quantity, density = FunkoGridDensityUtil.COMFORTABLE }: Props) {
  const matchedBy = (funko.matchedOn ?? []).filter((field) => !SELF_EVIDENT_MATCHES.includes(field));
  const hasExtraCopies = quantity !== undefined && quantity > 1;
  const isCompact = density === FunkoGridDensityUtil.COMPACT;

  return (
    <Link
      viewTransition
      to={FUNKO_ROUTES_PATHS.detail(String(funko.id))}
      className="group flex flex-col gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-card shadow-xs transition-shadow group-hover:ring-2 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary motion-reduce:transition-none">
        <FunkoImage image={funko.primaryImage} alt={funko.name} sizes={CARD_SIZES} className="size-full" />
        <div className="absolute top-2 left-2 flex gap-1">
          {funko.isChase ? (
            <Badge className="bg-accent-soft text-accent-soft-foreground" variant="secondary">
              Chase
            </Badge>
          ) : null}
          {funko.exclusive ? <Badge variant="secondary">{funko.exclusive}</Badge> : null}
        </div>
        {hasExtraCopies ? (
          <Badge className="absolute right-2 bottom-2" variant="default">
            ×{quantity}
          </Badge>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span className={isCompact ? 'truncate text-sm font-medium' : 'line-clamp-2 text-sm font-medium'}>
          {funko.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          #{funko.number} · {funko.category.name}
        </span>
        {matchedBy.length > 0 ? (
          <span className="truncate text-xs text-muted-foreground">
            Matched by {matchedBy.map((field) => FUNKO_MATCH_FIELD_LABELS[field]).join(', ')}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default FunkoCard;
