import { Link } from 'react-router';
import type { FunkoDetailApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Badge } from '@components/ui/badge';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import { formatDateTime } from '@utils/dateUtils';

type Props = {
  funko: FunkoDetailApiModel;
};

type RowProps = {
  label: string;
  children: React.ReactNode;
};

function SpecRow({ label, children }: RowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// The catalog facts, two columns. The category links to the filtered list.
function FunkoSpecs({ funko }: Props) {
  const categoryLink = `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.CATEGORY_ID}=${funko.category.id}`;

  return (
    <section aria-labelledby="details-heading" className="flex flex-col gap-3">
      <h2 id="details-heading" className="text-lg font-semibold">
        Details
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-card p-4">
        <SpecRow label="Number">
          <span className="tabular-nums">#{funko.number}</span>
        </SpecRow>
        <SpecRow label="Category">
          <Link to={categoryLink} className="underline-offset-4 hover:underline">
            {funko.category.name}
          </Link>
        </SpecRow>
        <SpecRow label="Type">{FUNKO_TYPE_LABELS[funko.type]}</SpecRow>
        <SpecRow label="Variant">
          <span className="flex flex-wrap gap-1">
            {funko.isChase ? (
              <Badge className="bg-accent-soft text-accent-soft-foreground" variant="secondary">
                Chase
              </Badge>
            ) : null}
            {funko.exclusive ? <Badge variant="secondary">{funko.exclusive}</Badge> : null}
            {!funko.isChase && !funko.exclusive ? 'Regular' : null}
          </span>
        </SpecRow>
        <SpecRow label="Barcode">
          {funko.barcode ? <span className="tabular-nums">{funko.barcode}</span> : 'None yet'}
        </SpecRow>
        <SpecRow label="Added">{formatDateTime(funko.createdAt)}</SpecRow>
      </dl>
    </section>
  );
}

export default FunkoSpecs;
