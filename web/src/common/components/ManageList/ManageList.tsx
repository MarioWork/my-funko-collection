import { ViewTransition } from 'react';
import EmptyState from '@components/EmptyState';
import { LIST_ITEM_TRANSITION_CLASS } from '@utils/motionUtils';
import ManageRowItem from './components/ManageRowItem';
import type { ManageRow } from './types';

type Props = {
  rows: ManageRow[];
  // "category", "tag": used in labels and ids.
  noun: string;
  hasNotes: boolean;
  rowPath: (id: string) => string;
  emptyTitle: string;
  emptyDescription: string;
  // False hides rename and delete on every row.
  canEdit: boolean;
};

// A short list of named things (categories, tags) with inline rename / delete per row. Adding is the page's
// "New …" button (ManageAddPanel). A row added or deleted fades in or out and the others slide into place.
function ManageList({ rows, noun, hasNotes, rowPath, emptyTitle, emptyDescription, canEdit }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <EmptyState pose="waiting" title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <ViewTransition key={row.id} default={LIST_ITEM_TRANSITION_CLASS}>
              <ManageRowItem
                row={row}
                rowPath={rowPath(String(row.id))}
                hasNotes={hasNotes}
                noun={noun}
                canEdit={canEdit}
              />
            </ViewTransition>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ManageList;
