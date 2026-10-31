import { useLoaderData } from 'react-router';
import type { TagApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil, ExportListKindUtil, type LoaderDataUtil } from '@app-types/utility';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ManageRow } from '@components/ManageList';
import ManageListPage from '@components/ManageListPage';
import { PAGE_ICONS } from '@utils/navigationUtils';
import type { loader } from './tagListLoader';

// The row's meta line for one that nothing uses yet.
const NOT_USED_META = 'Not used yet';

function toRow(tag: TagApiModel): ManageRow {
  const isInUse = tag.itemCount > 0;

  return {
    id: tag.id,
    name: tag.name,
    notes: tag.notes,
    meta: isInUse ? `${tag.itemCount} items` : NOT_USED_META,
    isDeletable: true,
    exportScope: ExportFunkosScopeUtil.TAG,
    exportDisabledReason: isInUse ? undefined : `No item carries ${tag.name} yet.`,
    deleteDescription: isInUse
      ? `The label comes off ${tag.itemCount} items. The items stay in their collections.`
      : 'Nothing uses this label yet.',
  };
}

function TagList() {
  const { tags } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <ManageListPage
      icon={PAGE_ICONS.TAGS}
      title="Tags"
      description="Labels on your items: which box, which shelf, anything you like. Deleting one only removes the label."
      noun="tag"
      pluralNoun="tags"
      exportKind={ExportListKindUtil.TAGS}
      rows={tags.map(toRow)}
      hasNotes
      rowPath={TAG_ROUTES_PATHS.update}
      addPath={TAG_ROUTES_PATHS.ADD}
      emptyTitle="No tags yet"
      emptyDescription="Add the first one, like Box 1 or Display shelf."
      // Tags label the user's own items, not the catalogue: every signed-in user may edit them.
      canEdit
    />
  );
}

export default TagList;
