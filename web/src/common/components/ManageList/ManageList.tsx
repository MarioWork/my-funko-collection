import EmptyState from '@components/EmptyState';
import ManageRowItem from './components/ManageRowItem';
import type { ManageRow } from './manageListUtils';

type Props = {
  rows: ManageRow[];
  // "category", "tag": used in labels and ids.
  noun: string;
  hasNotes: boolean;
  rowPath: (id: string) => string;
  emptyTitle: string;
  emptyDescription: string;
};

// A short list of named things (categories, tags) with inline rename / delete per row. Adding is the page's
// "New …" button (ManageAddPanel).
function ManageList({ rows, noun, hasNotes, rowPath, emptyTitle, emptyDescription }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <EmptyState pose="waiting" title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <ManageRowItem key={row.id} row={row} rowPath={rowPath(String(row.id))} hasNotes={hasNotes} noun={noun} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default ManageList;
