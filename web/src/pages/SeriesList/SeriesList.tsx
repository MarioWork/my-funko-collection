import { Library } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { SERIES_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import ManageList from '@components/ManageList';
import type { ManageRow } from '@components/ManageList';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import type { loader } from './seriesListLoader';

function toRow(series: SeriesApiModel): ManageRow {
  const isInUse = series.funkoCount > 0;

  return {
    id: series.id,
    name: series.name,
    notes: null,
    meta: isInUse ? `${series.funkoCount} funkos` : 'Not used yet',
    // Unlike a category, a series is optional: deleting one just clears it from its funkos.
    isDeletable: true,
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
        title="Series"
        description="The series a funko belongs to, like Daredevil: Born Again. Optional; deleting one only clears it from its funkos."
        actions={
          <LinkButton to={SERIES_ROUTES_PATHS.ADD} aria-label="New series" className="hidden lg:inline-flex">
            <Library data-icon="inline-start" aria-hidden="true" />
            New
          </LinkButton>
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
