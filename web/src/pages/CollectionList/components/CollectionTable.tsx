import type { ReactNode } from 'react';
import { Table, TableBody, TableHeader } from '@components/ui/table';
import CollectionTableHead from './CollectionTableHead';

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
          <CollectionTableHead />
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

export default CollectionTable;
