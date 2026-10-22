import { Tag } from 'lucide-react';
import { useLoaderData } from 'react-router';
import type { TagApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList/manageListUtils';
import PageHeader from '@components/PageHeader';
import type { loader } from './tagListLoader';

function toRow(tag: TagApiModel): ManageRow {
  return {
    id: tag.id,
    name: tag.name,
    notes: tag.notes,
    meta: tag.itemCount > 0 ? `${tag.itemCount} items` : 'Not used yet',
    isDeletable: true,
    deleteDescription:
      tag.itemCount > 0
        ? `The label comes off ${tag.itemCount} items. The items stay in their collections.`
        : 'Nothing uses this label yet.',
  };
}

function TagList() {
  const { tags } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tags"
        description="Labels on your items: which box, which shelf, anything you like. Deleting one only removes the label."
      />
      <ManageList
        rows={tags.map(toRow)}
        noun="tag"
        hasNotes
        addPath={TAG_ROUTES_PATHS.BASE}
        rowPath={TAG_ROUTES_PATHS.update}
        emptyIcon={Tag}
        emptyTitle="No tags yet"
        emptyDescription="Add one above, like Box 1 or Display shelf."
      />
    </div>
  );
}

export default TagList;
