import { Link } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { Badge } from '@components/ui/badge';
import { TableCell, TableRow } from '@components/ui/table';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  collection: CollectionApiModel;
  menu: React.ReactNode;
};

// One collection in the list layout: the name links the whole row, the ⋯ menu sits above that link.
function CollectionTableRow({ collection, menu }: Props) {
  return (
    <TableRow className="relative">
      <TableCell className="font-medium">
        <Link
          to={COLLECTION_ROUTES_PATHS.detail(String(collection.id))}
          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collection.name}
        </Link>
        {collection.isDefault ? <Badge className="ml-2">Default</Badge> : null}
      </TableCell>
      <TableCell className="text-right tabular-nums">{collection.itemCount}</TableCell>
      <TableCell className="text-right tabular-nums">{collection.totalQuantity}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCents(collection.totalSpentCents)}</TableCell>
      <TableCell className="relative z-10 text-right">{menu}</TableCell>
    </TableRow>
  );
}

export default CollectionTableRow;
