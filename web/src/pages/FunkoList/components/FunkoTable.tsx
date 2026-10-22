import { Link } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';

type Props = {
  funkos: FunkoApiModel[];
};

type RowProps = {
  funko: FunkoApiModel;
};

const THUMB_SIZES = '48px';

function FunkoTableRow({ funko }: RowProps) {
  return (
    <TableRow className="relative">
      <TableCell>
        <FunkoImage
          image={funko.primaryImage}
          alt={funko.name}
          sizes={THUMB_SIZES}
          className="aspect-3/4 w-10 rounded-md"
        />
      </TableCell>
      <TableCell className="font-medium">
        <Link
          to={FUNKO_ROUTES_PATHS.detail(String(funko.id))}
          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {funko.name}
        </Link>
        {funko.isChase ? (
          <Badge variant="secondary" className="ml-2">
            Chase
          </Badge>
        ) : null}
        {funko.exclusive ? (
          <Badge variant="outline" className="ml-2">
            {funko.exclusive}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="tabular-nums">#{funko.number}</TableCell>
      <TableCell>{funko.category.name}</TableCell>
      <TableCell className="hidden @3xl:table-cell">{FUNKO_TYPE_LABELS[funko.type]}</TableCell>
      <TableCell className="hidden text-muted-foreground @3xl:table-cell">
        {funko.collections.map((collection) => collection.name).join(', ') || '—'}
      </TableCell>
    </TableRow>
  );
}

function FunkoTableHead() {
  return (
    <TableRow>
      <TableHead className="w-16">
        <span className="sr-only">Photo</span>
      </TableHead>
      <TableHead>Name</TableHead>
      <TableHead className="w-24">Number</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="hidden @3xl:table-cell">Type</TableHead>
      <TableHead className="hidden @3xl:table-cell">Collections</TableHead>
    </TableRow>
  );
}

// The list view: a real table with the thumbnail always present. Extra columns appear as the pane widens.
function FunkoTable({ funkos }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <FunkoTableHead />
        </TableHeader>
        <TableBody>
          {funkos.map((funko) => (
            <FunkoTableRow key={funko.id} funko={funko} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default FunkoTable;
