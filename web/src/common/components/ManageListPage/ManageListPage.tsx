import type { LucideIcon } from 'lucide-react';
import { Outlet } from 'react-router';
import type { ExportListKindUtil } from '@app-types/utility';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ListExportMenu from '@components/ListExportMenu';
import ManageList, { type ManageRow } from '@components/ManageList';
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
};

// The page around a ManageList (categories, series, tags): a header with New and Export, the list, the phone's
// add button, and the routed New form. On phones that form is its own page instead.
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
}: Props) {
  const childPage = useMobileChildPage();
  const addLabel = `New ${noun}`;
  const isEmpty = rows.length === 0;

  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={Icon}
        title={title}
        description={description}
        actions={
          <LinkButton to={addPath} aria-label={addLabel} className="hidden lg:inline-flex">
            <Icon data-icon="inline-start" aria-hidden="true" />
            New
          </LinkButton>
        }
        iconActions={
          <ListExportMenu
            kind={exportKind}
            noun={pluralNoun}
            disabledReason={reasonWhen(isEmpty, `No ${pluralNoun} to export yet.`)}
          />
        }
      />
      <ManageList
        rows={rows}
        noun={noun}
        hasNotes={hasNotes}
        rowPath={rowPath}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <AddFab to={addPath} label={addLabel} />
      <Outlet />
    </div>
  );
}

export default ManageListPage;
