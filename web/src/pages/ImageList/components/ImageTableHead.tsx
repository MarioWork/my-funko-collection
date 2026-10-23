import { TableHead, TableHeader, TableRow } from '@components/ui/table';
import { TABLE_HEADER_ROW_CLASS } from '@utils/tableUtils';

type Props = {
  // "Image" in the flat list, "Funko" when grouped.
  firstLabel: string;
};

// The columns both views share; dimensions and date appear as the pane widens.
function ImageTableHead({ firstLabel }: Props) {
  return (
    <TableHeader>
      <TableRow className={TABLE_HEADER_ROW_CLASS}>
        <TableHead>{firstLabel}</TableHead>
        <TableHead className="hidden @3xl:table-cell">Dimensions</TableHead>
        <TableHead>Size</TableHead>
        <TableHead className="hidden @3xl:table-cell">Added</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export default ImageTableHead;
