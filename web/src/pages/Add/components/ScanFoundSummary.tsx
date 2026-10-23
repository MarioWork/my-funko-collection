import type { FunkoApiModel } from '@app-types/models';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';

type Props = {
  funko: FunkoApiModel;
};

type MembershipBadgesProps = {
  memberships: FunkoApiModel['collections'];
};

const THUMB_SIZES = '96px';

function MembershipBadges({ memberships }: MembershipBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {memberships.map((membership) => (
        <Badge key={membership.id} variant="secondary">
          In {membership.name}
        </Badge>
      ))}
    </div>
  );
}

// The scanned funko at a glance: its photo, name, number, category and the lists it is already in.
function ScanFoundSummary({ funko }: Props) {
  return (
    <div className="flex gap-3">
      <FunkoImage
        image={funko.primaryImage}
        alt={funko.name}
        sizes={THUMB_SIZES}
        className="aspect-3/4 w-20 rounded-lg"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-base font-semibold">{funko.name}</h2>
        <p className="text-sm text-muted-foreground">
          #{funko.number} · {funko.category.name}
        </p>
        <MembershipBadges memberships={funko.collections} />
      </div>
    </div>
  );
}

export default ScanFoundSummary;
