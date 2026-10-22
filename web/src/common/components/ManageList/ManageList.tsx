import type { LucideIcon } from 'lucide-react';
import EmptyState from '@components/EmptyState';
import ManageAddForm from './components/ManageAddForm';
import ManageRowItem from './components/ManageRowItem';
import type { ManageRow } from './manageListUtils';

type Props = {
  rows: ManageRow[];
  // "category", "tag": used in labels and ids.
  noun: string;
  hasNotes: boolean;
  addPath: string;
  rowPath: (id: string) => string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
};

// A short list of named things (categories, tags) with an add form on top and inline rename / delete per row.
function ManageList({ rows, noun, hasNotes, addPath, rowPath, emptyIcon, emptyTitle, emptyDescription }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ManageAddForm addPath={addPath} hasNotes={hasNotes} noun={noun} />
      {rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
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
