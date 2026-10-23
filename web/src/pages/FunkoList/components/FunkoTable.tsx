import { Link } from 'react-router';
import type { FunkoApiModel } from '@app-types/models';
import { FUNKO_TYPE_LABELS } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import FunkoImage from '@components/FunkoImage';
import TableSkeletonRows from '@components/TableSkeletonRows';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';

type Props = {
  funkos: FunkoApiModel[];
  // The next page is loading: placeholder rows under the last one.
  isLoadingMore?: boolean;
};

type RowProps = {
  funko: FunkoApiModel;
};

type CollectionNamesProps = {
  names: string[];
};

const THUMB_SIZES = '48px';
// More than this and the rest fold into "+N", so a funko in many collections keeps a one-line row.
const VISIBLE_COLLECTIONS = 2;
const NONE = '—';
const WIDE_ONLY = 'hidden @3xl:table-cell';
// Image, name, number, category, then the two columns that only show on a wide pane.
const SKELETON_COLUMNS = ['w-16', '', 'w-24', '', WIDE_ONLY, WIDE_ONLY];

// The first collections by name, the rest as "+N" with the full list in its tooltip (and read out in full).
function CollectionNames({ names }: CollectionNamesProps) {
  if (names.length === 0) return <span className="text-muted-foreground">{NONE}</span>;

  const visible = names.slice(0, VISIBLE_COLLECTIONS);
  const hiddenCount = names.length - visible.length;
  const allNames = names.join(', ');

  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
      <span className="max-w-48 truncate">{visible.join(', ')}</span>
      {hiddenCount > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={<Badge variant="outline" tabIndex={0} aria-label={`In ${names.length} collections: ${allNames}`} />}
          >
            +{hiddenCount}
          </TooltipTrigger>
          <TooltipContent>{allNames}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

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
          viewTransition
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
      <TableCell className={WIDE_ONLY}>{FUNKO_TYPE_LABELS[funko.type]}</TableCell>
      <TableCell className={WIDE_ONLY}>
        <CollectionNames names={funko.collections.map((collection) => collection.name)} />
      </TableCell>
    </TableRow>
  );
}

function FunkoTableHead() {
  return (
    <TableRow className={TABLE_HEADER_ROW_CLASS}>
      <TableHead className="w-16">
        <span className="sr-only">Image</span>
      </TableHead>
      <TableHead>Name</TableHead>
      <TableHead className="w-24">Number</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className={WIDE_ONLY}>Type</TableHead>
      <TableHead className={WIDE_ONLY}>Collections</TableHead>
    </TableRow>
  );
}

// The list view: a real table with the thumbnail always present. Extra columns appear as the pane widens.
function FunkoTable({ funkos, isLoadingMore = false }: Props) {
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
          {isLoadingMore ? <TableSkeletonRows columnClassNames={SKELETON_COLUMNS} /> : null}
        </TableBody>
      </Table>
    </div>
  );
}

export default FunkoTable;
