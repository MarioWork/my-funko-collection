import { Tags } from 'lucide-react';
import { useLoaderData } from 'react-router';
import type { CategoryApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList/manageListUtils';
import PageHeader from '@components/PageHeader';
import type { loader } from './categoryListLoader';

function toRow(category: CategoryApiModel): ManageRow {
  const isInUse = category.funkoCount > 0;

  return {
    id: category.id,
    name: category.name,
    notes: null,
    meta: isInUse ? `${category.funkoCount} funkos` : 'Not used yet',
    isDeletable: !isInUse,
    deleteDescription: 'No funko uses this line. This cannot be undone.',
  };
}

function CategoryList() {
  const { categories } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Categories"
        description="The line printed on the box, like Pop! Marvel. A line with funkos in it cannot be deleted."
      />
      <ManageList
        rows={categories.map(toRow)}
        noun="category"
        hasNotes={false}
        addPath={CATEGORY_ROUTES_PATHS.BASE}
        rowPath={CATEGORY_ROUTES_PATHS.update}
        emptyIcon={Tags}
        emptyTitle="No categories yet"
        emptyDescription="Add the first line above; new funkos pick from this list."
      />
    </div>
  );
}

export default CategoryList;
