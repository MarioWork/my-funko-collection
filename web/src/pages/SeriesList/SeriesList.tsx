import { useLoaderData } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import { ExportFunkosScopeUtil, ExportListKindUtil, type LoaderDataUtil } from '@app-types/utility';
import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ManageRow } from '@components/ManageList';
import ManageListPage from '@components/ManageListPage';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { useIsAdmin } from '@hooks/useIsAdmin';
import type { loader } from './seriesListLoader';

// The row's meta line for one that nothing uses yet.
const NOT_USED_META = 'Not used yet';
const ADMIN_EMPTY_DESCRIPTION = "Add one like Stranger Things, or create it right from a funko's form.";
const MEMBER_EMPTY_DESCRIPTION = 'An admin adds the series; they show up here.';

function toRow(series: SeriesApiModel): ManageRow {
  const isInUse = series.funkoCount > 0;

  return {
    id: series.id,
    name: series.name,
    notes: null,
    meta: isInUse ? `${series.funkoCount} funkos` : NOT_USED_META,
    // Every funko has a series, so one with funkos cannot be deleted, like a category.
    isDeletable: !isInUse,
    exportScope: ExportFunkosScopeUtil.SERIES,
    exportDisabledReason: isInUse ? undefined : `No funko is in ${series.name} yet.`,
    deleteDescription: 'No funko uses this series. This cannot be undone.',
  };
}

function SeriesList() {
  const { series } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isAdmin = useIsAdmin();

  return (
    <ManageListPage
      icon={PAGE_ICONS.SERIES}
      title="Series"
      description="The show, film or game a funko comes from, like Daredevil: Born Again. Every funko has one, so a series with funkos in it cannot be deleted."
      noun="series"
      pluralNoun="series"
      exportKind={ExportListKindUtil.SERIES}
      rows={series.map(toRow)}
      hasNotes={false}
      rowPath={SERIES_ROUTES_PATHS.update}
      addPath={SERIES_ROUTES_PATHS.ADD}
      emptyTitle="No series yet"
      emptyDescription={isAdmin ? ADMIN_EMPTY_DESCRIPTION : MEMBER_EMPTY_DESCRIPTION}
      canEdit={isAdmin}
    />
  );
}

export default SeriesList;
