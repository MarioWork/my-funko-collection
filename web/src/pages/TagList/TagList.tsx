import { Plus } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { TagApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { TAG_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList/manageListUtils';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
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
  const childPage = useMobileChildPage();
  const { tags } = useLoaderData<LoaderDataUtil<typeof loader>>();

  // On phones the New tag form is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tags"
        description="Labels on your items: which box, which shelf, anything you like. Deleting one only removes the label."
        actions={
          <LinkButton to={TAG_ROUTES_PATHS.ADD} className="hidden lg:inline-flex">
            <Plus data-icon="inline-start" aria-hidden="true" />
            New tag
          </LinkButton>
        }
      />
      <ManageList
        rows={tags.map(toRow)}
        noun="tag"
        hasNotes
        rowPath={TAG_ROUTES_PATHS.update}
        emptyTitle="No tags yet"
        emptyDescription="Add the first one, like Box 1 or Display shelf."
      />
      <AddFab to={TAG_ROUTES_PATHS.ADD} label="New tag" />
      <Outlet />
    </div>
  );
}

export default TagList;
