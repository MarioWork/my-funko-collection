import { useLoaderData } from 'react-router';
import type { CategoryApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil, ExportListKindUtil, type LoaderDataUtil } from '@app-types/utility';
import { CATEGORY_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ManageRow } from '@components/ManageList';
import ManageListPage from '@components/ManageListPage';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import type { loader } from './categoryListLoader';

// The row's meta line for one that nothing uses yet.
const NOT_USED_META = 'Not used yet';
const ADMIN_EMPTY_DESCRIPTION = 'Add the first line; new funkos pick from this list.';
const MEMBER_EMPTY_DESCRIPTION = 'An admin adds the lines; they show up here.';

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
  const { categories } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isAdmin = useIsAdmin();

  return (
    <ManageListPage
      icon={PAGE_ICONS.CATEGORIES}
      title="Categories"
      description="The line printed on the box, like Pop! Marvel. A line with funkos in it cannot be deleted."
      noun="category"
      pluralNoun="categories"
      exportKind={ExportListKindUtil.CATEGORIES}
      rows={categories.map(toRow)}
      hasNotes={false}
      rowPath={CATEGORY_ROUTES_PATHS.update}
      addPath={CATEGORY_ROUTES_PATHS.ADD}
      emptyTitle="No categories yet"
      emptyDescription={isAdmin ? ADMIN_EMPTY_DESCRIPTION : MEMBER_EMPTY_DESCRIPTION}
      canEdit={isAdmin}
    />
  );
}

export default CategoryList;
