import type { LucideIcon } from 'lucide-react';
import { Outlet } from 'react-router';
import type { ExportListKindUtil } from '@app-types/utility';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ListExportMenu from '@components/ListExportMenu';
import ManageList, { ManageListContext, type ManageRow } from '@components/ManageList';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  // The page's icon, as in the navigation; also on the "New" button.
  icon: LucideIcon;
  title: string;
  description: string;
  // "tag" and "tags": in the labels, the ids and the export menu.
  noun: string;
  pluralNoun: string;
  exportKind: ExportListKindUtil;
  rows: ManageRow[];
  hasNotes: boolean;
  rowPath: (id: string) => string;
  // The routed New form (`<feature>/add`).
  addPath: string;
  emptyTitle: string;
  emptyDescription: string;
  // False shows the list read-only: no New, rename or delete (a member on a catalogue list).
  canEdit?: boolean;
};

// The page around a ManageList (categories, series, tags): a header with New and Export, the list, the phone's
// add button, and the routed New form. On phones that form is its own page instead. Read-only when `canEdit` is
// false: the list and Export stay.
function ManageListPage({
  icon: Icon,
  title,
  description,
  noun,
  pluralNoun,
  exportKind,
  rows,
  hasNotes,
  rowPath,
  addPath,
  emptyTitle,
  emptyDescription,
  canEdit = true,
}: Props) {
  const childPage = useMobileChildPage();
  const addLabel = `New ${noun}`;
  const isEmpty = rows.length === 0;

  // On phones the New form is its own page; never for a read-only list.
  if (childPage && canEdit) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={Icon}
        title={title}
        description={description}
        actions={
          canEdit ? (
            <LinkButton to={addPath} aria-label={addLabel} className="hidden lg:inline-flex">
              <Icon data-icon="inline-start" aria-hidden="true" />
              New
            </LinkButton>
          ) : null
        }
        iconActions={
          <ListExportMenu
            kind={exportKind}
            noun={pluralNoun}
            disabledReason={reasonWhen(isEmpty, `No ${pluralNoun} to export yet.`)}
          />
        }
      />
      <ManageListContext value={{ canEdit }}>
        <ManageList
          rows={rows}
          noun={noun}
          hasNotes={hasNotes}
          rowPath={rowPath}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </ManageListContext>
      {canEdit ? <AddFab to={addPath} label={addLabel} /> : null}
      {canEdit ? <Outlet /> : null}
    </div>
  );
}

export default ManageListPage;
