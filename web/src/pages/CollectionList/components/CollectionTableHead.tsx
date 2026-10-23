import { TableHead, TableRow } from '@components/ui/table';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';

// The list layout's column headings; the last column holds each row's ⋯ menu.
function CollectionTableHead() {
  return (
    <TableRow className={TABLE_HEADER_ROW_CLASS}>
      <TableHead>Name</TableHead>
      <TableHead className="w-24 text-right">Funkos</TableHead>
      <TableHead className="w-24 text-right">Pieces</TableHead>
      <TableHead className="w-32 text-right">Total</TableHead>
      <TableHead className="w-14">
        <span className="sr-only">Actions</span>
      </TableHead>
    </TableRow>
  );
}

export default CollectionTableHead;
