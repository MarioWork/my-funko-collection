import { Library } from 'lucide-react';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { Outlet, useLoaderData } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList';
import ListExportMenu from '@components/ListExportMenu';
import PageHeader from '@components/PageHeader';
import { ExportFunkosScopeUtil, ExportListKindUtil, type LoaderDataUtil } from '@app-types/utility';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { reasonWhen } from '@utils/disabledReasonUtils';
import type { loader } from './seriesListLoader';

// The row's meta line for one that nothing uses yet.
const NOT_USED_META = 'Not used yet';

function toRow(series: SeriesApiModel): ManageRow {
  const isInUse = series.funkoCount > 0;

  return {
    id: series.id,
    name: series.name,
    notes: null,
    meta: isInUse ? `${series.funkoCount} funkos` : NOT_USED_META,
    // Unlike a category, a series is optional: deleting one just clears it from its funkos.
    isDeletable: true,
    exportScope: ExportFunkosScopeUtil.SERIES,
    exportDisabledReason: isInUse ? undefined : `No funko is in ${series.name} yet.`,
    deleteDescription: isInUse
      ? `${series.funkoCount} funkos lose this series. The funkos stay in your catalog.`
      : 'No funko uses this series yet.',
  };
}

function SeriesList() {
  const childPage = useMobileChildPage();
  const { series } = useLoaderData<LoaderDataUtil<typeof loader>>();

  // On phones the New series form is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.SERIES}
        title="Series"
        description="The series a funko belongs to, like Daredevil: Born Again. Optional; deleting one only clears it from its funkos."
        actions={
          <LinkButton to={SERIES_ROUTES_PATHS.ADD} aria-label="New series" className="hidden lg:inline-flex">
            <Library data-icon="inline-start" aria-hidden="true" />
            New
          </LinkButton>
        }
        iconActions={
          <ListExportMenu
            kind={ExportListKindUtil.SERIES}
            noun="series"
            disabledReason={reasonWhen(series.length === 0, 'No series to export yet.')}
          />
        }
      />
      <ManageList
        rows={series.map(toRow)}
        noun="series"
        hasNotes={false}
        rowPath={SERIES_ROUTES_PATHS.update}
        emptyTitle="No series yet"
        emptyDescription="Add one like Stranger Things, or create it right from a funko's form."
      />
      <AddFab to={SERIES_ROUTES_PATHS.ADD} label="New series" />
      <Outlet />
    </div>
  );
}

export default SeriesList;
