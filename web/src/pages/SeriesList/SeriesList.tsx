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
  const { series } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const isAdmin = useIsAdmin();

  return (
    <ManageListPage
      icon={PAGE_ICONS.SERIES}
      title="Series"
      description="The series a funko belongs to, like Daredevil: Born Again. Optional; deleting one only clears it from its funkos."
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
