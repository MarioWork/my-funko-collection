import { Book } from 'lucide-react';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { Outlet, useLoaderData } from 'react-router';
import type { CategoryApiModel } from '@app-types/models';
import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList';
import ListExportMenu from '@components/ListExportMenu';
import PageHeader from '@components/PageHeader';
import { ExportFunkosScopeUtil, ExportListKindUtil, type LoaderDataUtil } from '@app-types/utility';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { reasonWhen } from '@utils/disabledReasonUtils';
import type { loader } from './categoryListLoader';

// The row's meta line for one that nothing uses yet.
const NOT_USED_META = 'Not used yet';

function toRow(category: CategoryApiModel): ManageRow {
  const isInUse = category.funkoCount > 0;

  return {
    id: category.id,
    name: category.name,
    notes: null,
    meta: isInUse ? `${category.funkoCount} funkos` : NOT_USED_META,
    isDeletable: !isInUse,
    exportScope: ExportFunkosScopeUtil.CATEGORY,
    exportDisabledReason: isInUse ? undefined : `No funko is in ${category.name} yet.`,
    deleteDescription: 'No funko uses this line. This cannot be undone.',
  };
}

function CategoryList() {
  const childPage = useMobileChildPage();
  const { categories } = useLoaderData<LoaderDataUtil<typeof loader>>();

  // On phones the New category form is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.CATEGORIES}
        title="Categories"
        description="The line printed on the box, like Pop! Marvel. A line with funkos in it cannot be deleted."
        actions={
          <LinkButton to={CATEGORY_ROUTES_PATHS.ADD} aria-label="New category" className="hidden lg:inline-flex">
            <Book data-icon="inline-start" aria-hidden="true" />
            New
          </LinkButton>
        }
        iconActions={
          <ListExportMenu
            kind={ExportListKindUtil.CATEGORIES}
            noun="categories"
            disabledReason={reasonWhen(categories.length === 0, 'No categories to export yet.')}
          />
        }
      />
      <ManageList
        rows={categories.map(toRow)}
        noun="category"
        hasNotes={false}
        rowPath={CATEGORY_ROUTES_PATHS.update}
        emptyTitle="No categories yet"
        emptyDescription="Add the first line; new funkos pick from this list."
      />
      <AddFab to={CATEGORY_ROUTES_PATHS.ADD} label="New category" />
      <Outlet />
    </div>
  );
}

export default CategoryList;
