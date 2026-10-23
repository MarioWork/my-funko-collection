import { Skeleton } from '@components/ui/skeleton';
import { TableCell, TableRow } from '@components/ui/table';

type Props = {
  // One entry per column: its cell classes, so the placeholders hide where the real columns do.
  columnClassNames: string[];
  rowCount?: number;
};

const DEFAULT_ROW_COUNT = 4;

// Rows still on their way: a pulsing bar per cell, laid out like the table's real rows. Decorative: the list's
// footer says in words that more is loading.
function TableSkeletonRows({ columnClassNames, rowCount = DEFAULT_ROW_COUNT }: Props) {
  return Array.from({ length: rowCount }, (_, rowIndex) => (
    <TableRow key={rowIndex} aria-hidden="true" className="hover:bg-transparent">
      {columnClassNames.map((className, columnIndex) => (
        <TableCell key={columnIndex} className={className}>
          <Skeleton className="h-4 w-full max-w-40" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default TableSkeletonRows;
