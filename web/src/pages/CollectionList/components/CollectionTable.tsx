import type { ReactNode } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';

type Props = {
  // One CollectionCard per collection in its list layout (a table row each).
  children: ReactNode;
};

// The list layout, built like the funkos page's list: a real table in a white tile, the header sticky.
function CollectionTable({ children }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow className={TABLE_HEADER_ROW_CLASS}>
            <TableHead>Name</TableHead>
            <TableHead className="w-24 text-right">Funkos</TableHead>
            <TableHead className="w-24 text-right">Pieces</TableHead>
            <TableHead className="w-32 text-right">Total</TableHead>
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

export default CollectionTable;
