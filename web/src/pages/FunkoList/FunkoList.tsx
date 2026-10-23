import { Package, ScanBarcode } from 'lucide-react';
import { Outlet } from 'react-router';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import FunkoCard from '@components/FunkoCard';
import FunkoGrid from '@components/FunkoGrid';
import LinkButton from '@components/LinkButton';
import ListPagination from '@components/ListPagination';
import PageHeader from '@components/PageHeader';
import { useIsRefreshing } from '@hooks/useIsRefreshing';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { useLayoutPreference } from '@hooks/useLayoutPreference';
import { useIsDesktop } from '@hooks/useMediaQuery';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import FunkoListEmpty from './components/FunkoListEmpty';
import FunkoListToolbar from './components/FunkoListToolbar';
import FunkoTable from './components/FunkoTable';
import { FUNKO_LAYOUT_STORAGE_KEY } from './funkoListUtils';
import { useFunkoListParams } from './hooks/useFunkoListParams';

function DesktopActions() {
  return (
    <>
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_SCAN} variant="outline">
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.NESTED_FORM} aria-label="New funko">
        <Package data-icon="inline-start" aria-hidden="true" />
        New
      </LinkButton>
    </>
  );
}

function FunkoList() {
  const childPage = useMobileChildPage();
  const isRefreshing = useIsRefreshing();
  const { data, query, chips, clearFilters } = useFunkoListParams();
  const { layout, density, setLayout } = useLayoutPreference(FUNKO_LAYOUT_STORAGE_KEY);
  const isDesktop = useIsDesktop();
  const { funkosResponse } = data;
  const hasFunkos = funkosResponse.data.length > 0;
  const isFiltered = chips.length > 0 || query.length > 0;

  // On phones the Add flow opened from here is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Funkos"
        description={
          isFiltered
            ? `${funkosResponse.totalResultNumber} matching`
            : `${funkosResponse.totalResultNumber} in your catalog`
        }
        actions={isDesktop ? <DesktopActions /> : null}
      >
        <FunkoListToolbar layout={layout} onLayoutChange={setLayout} />
      </PageHeader>

      {/* One tile behind the results, like the header above it. Dims while new results load. */}
      <div
        aria-busy={isRefreshing}
        className={cn(
          'flex flex-col gap-4 rounded-xl border bg-card p-4',
          DIMMABLE_CLASS,
          isRefreshing && DIMMED_CLASS,
        )}
      >
        {!hasFunkos ? <FunkoListEmpty isFiltered={isFiltered} onClearFilters={clearFilters} /> : null}

        {hasFunkos && density ? (
          <FunkoGrid label="Funkos" density={density}>
            {funkosResponse.data.map((funko) => (
              <li key={funko.id}>
                <FunkoCard funko={funko} density={density} />
              </li>
            ))}
          </FunkoGrid>
        ) : null}

        {hasFunkos && !density ? <FunkoTable funkos={funkosResponse.data} /> : null}

        <ListPagination page={data.page} size={data.pageSize} total={funkosResponse.totalResultNumber} />
      </div>
      <AddFab />
      <Outlet />
    </div>
  );
}

export default FunkoList;
