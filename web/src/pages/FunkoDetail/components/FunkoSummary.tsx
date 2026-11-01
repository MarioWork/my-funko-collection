import { Link } from 'react-router';
import type { FunkoDetailApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS, SubmissionStatusUtil } from '@app-types/utility';
import { Badge } from '@components/ui/badge';
import { Separator } from '@components/ui/separator';
import { formatDateTime } from '@utils/dateUtils';
import { funkosInCategoryPath, funkosInSeriesPath } from '@utils/funkoLinkUtils';
import SubmissionDetails from './SubmissionDetails';

type Props = {
  funko: FunkoDetailApiModel;
  // Top right, beside the name: the Owned / Wishlist icons and the ⋯ menu (Edit, Lists, Delete).
  actions: React.ReactNode;
};

type HeadingProps = Pick<Props, 'funko' | 'actions'>;

type RowProps = {
  label: string;
  children: React.ReactNode;
};

type VariantBadgesProps = {
  funko: FunkoDetailApiModel;
};

const TITLE_ID = 'funko-title';

function SpecRow({ label, children }: RowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// Chase and the exclusive as badges, or "Regular" when it is neither.
function VariantBadges({ funko }: VariantBadgesProps) {
  const isRegular = !funko.isChase && !funko.exclusive;

  return (
    <span className="flex flex-wrap gap-1">
      {funko.isChase ? (
        <Badge className="bg-accent-soft text-accent-soft-foreground" variant="secondary">
          Chase
        </Badge>
      ) : null}
      {funko.exclusive ? <Badge variant="secondary">{funko.exclusive}</Badge> : null}
      {isRegular ? 'Regular' : null}
    </span>
  );
}

// The page's one h1, its number, category and series (each links to the filtered catalog), and the actions.
function SummaryHeading({ funko, actions }: HeadingProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 id={TITLE_ID} className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">
          {funko.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">#{funko.number}</span> ·{' '}
          <Link
            viewTransition
            to={funkosInCategoryPath(funko.category.id)}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {funko.category.name}
          </Link>
          {' · '}
          <Link
            viewTransition
            to={funkosInSeriesPath(funko.series.id)}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {funko.series.name}
          </Link>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  );
}

// The funko at a glance, in one tile: name and actions, then the catalog facts. A submission says where it stands.
function FunkoSummary({ funko, actions }: Props) {
  const isSubmission = funko.status !== SubmissionStatusUtil.APPROVED;

  return (
    <section aria-labelledby={TITLE_ID} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <SummaryHeading funko={funko} actions={actions} />
      <Separator />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SpecRow label="Type">{FUNKO_TYPE_LABELS[funko.type]}</SpecRow>
        <SpecRow label="Variant">
          <VariantBadges funko={funko} />
        </SpecRow>
        <SpecRow label="Barcode">
          {funko.barcode ? <span className="tabular-nums">{funko.barcode}</span> : 'None yet'}
        </SpecRow>
        <SpecRow label="Added">{formatDateTime(funko.createdAt)}</SpecRow>
        {isSubmission ? (
          <SpecRow label="Submission">
            <SubmissionDetails funko={funko} />
          </SpecRow>
        ) : null}
      </dl>
    </section>
  );
}

export default FunkoSummary;
