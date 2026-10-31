import { Boxes, Coins, Images, Package } from 'lucide-react';
import type { StatsApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS, IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';
import StatTile from './StatTile';
import { formatCents } from '@utils/moneyUtils';
import { formatBytes } from '@utils/byteUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import { funkosInOwnCollectionsPath } from '@utils/funkoLinkUtils';

type Props = {
  stats: StatsApiModel;
};

// Four numbers, all about the signed-in user's own collections: the funkos in them, pieces in the default list,
// money in it, photos of those funkos (a link to the Images page for an admin only).
function StatsGrid({ stats }: Props) {
  const defaultCollection = stats.collections.find((collection) => collection.isDefault);
  const ownedLabel = defaultCollection ? `In ${defaultCollection.name}` : 'Owned';
  const ownedPath = defaultCollection ? COLLECTION_ROUTES_PATHS.detail(String(defaultCollection.id)) : undefined;
  const isAdmin = useIsAdmin();

  return (
    <section aria-label="Overview" className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
      <StatTile
        icon={Package}
        label="Funkos"
        value={String(stats.funkoCount)}
        hint={`${stats.categoryCount} categories`}
        to={funkosInOwnCollectionsPath()}
      />
      <StatTile
        icon={Boxes}
        label={ownedLabel}
        value={String(defaultCollection?.totalQuantity ?? 0)}
        hint={`${defaultCollection?.itemCount ?? 0} different funkos`}
        to={ownedPath}
      />
      <StatTile
        icon={Coins}
        label="Total"
        value={formatCents(defaultCollection?.totalSpentCents ?? 0)}
        hint={ownedLabel}
        to={ownedPath}
      />
      <StatTile
        icon={Images}
        label="Images"
        value={String(stats.imageCount)}
        hint={formatBytes(stats.imageBytes)}
        to={isAdmin ? IMAGE_ROUTES_PATHS.BASE : undefined}
      />
    </section>
  );
}

export default StatsGrid;
