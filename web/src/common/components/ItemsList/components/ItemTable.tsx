import { useTable } from '@tanstack/react-table';
import type { CollectionItemApiModel } from '@app-types/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS, FADE_IN_CLASS } from '@utils/motionUtils';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';
import { useItemsListContext } from '../hooks/useItemsListContext';
import { itemTableFeatures } from './itemTableColumnHelper';
import { buildItemTableColumns } from './itemTableColumns';

type Props = {
  items: CollectionItemApiModel[];
};

// The desktop layout of the list: a real table on TanStack's row model, sticky header.
function ItemTable({ items }: Props) {
  const { hasCollectionFilter, busyItemId } = useItemsListContext();
  const columns = buildItemTableColumns(hasCollectionFilter);
  const table = useTable({ features: itemTableFeatures, columns, data: items });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={TABLE_HEADER_ROW_CLASS}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(FADE_IN_CLASS, DIMMABLE_CLASS, busyItemId === row.original.id && DIMMED_CLASS)}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ItemTable;
