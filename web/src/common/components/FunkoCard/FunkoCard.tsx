import type { FunkoApiModel, FunkoSummaryApiModel } from '@app-types/models';
import { FUNKO_MATCH_FIELD_LABELS, FunkoGridDensityUtil, FunkoMatchFieldUtil } from '@app-types/utility';
import FunkoCardFrame from '@components/FunkoCardFrame';
import { Badge } from '@components/ui/badge';

// A funko summary, plus what a search hit or a collection list adds to it.
type FunkoCardFunko = FunkoSummaryApiModel & Partial<Pick<FunkoApiModel, 'matchedOn' | 'collections'>>;

type Props = {
  funko: FunkoCardFunko;
  quantity?: number;
  density?: FunkoGridDensityUtil;
};

type CornerProps = {
  funko: FunkoCardFunko;
};

// A hit on the name or the id is obvious from the card itself, so the caption leaves those out.
const SELF_EVIDENT_MATCHES: FunkoMatchFieldUtil[] = [FunkoMatchFieldUtil.NAME, FunkoMatchFieldUtil.ID];

// The photo's top-left corner: Chase and the exclusive, when the funko has them.
function ChaseAndExclusive({ funko }: CornerProps) {
  return (
    <div className="absolute top-2 left-2 flex gap-1">
      {funko.isChase ? (
        <Badge className="bg-accent-soft text-accent-soft-foreground" variant="secondary">
          Chase
        </Badge>
      ) : null}
      {funko.exclusive ? <Badge variant="secondary">{funko.exclusive}</Badge> : null}
    </div>
  );
}

// Image first, two badges at most, the whole card is the link (FunkoCardFrame). Matched-by caption only when a
// search hit it.
function FunkoCard({ funko, quantity, density = FunkoGridDensityUtil.COMFORTABLE }: Props) {
  const matchedBy = (funko.matchedOn ?? []).filter((field) => !SELF_EVIDENT_MATCHES.includes(field));
  const isCompact = density === FunkoGridDensityUtil.COMPACT;

  return (
    <FunkoCardFrame funko={funko} quantity={quantity} photoCorner={<ChaseAndExclusive funko={funko} />}>
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
    </FunkoCardFrame>
  );
}

export default FunkoCard;
