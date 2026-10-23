import { Package, ScanBarcode } from 'lucide-react';
import { PAGE_ICONS } from '@utils/navigationUtils';
import type { FunkoApiModel } from '@app-types/models';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import LinkButton from '@components/LinkButton';
import InfiniteListFooter from '@components/InfiniteListFooter';
import PageHeader from '@components/PageHeader';
import { useInfiniteList } from '@hooks/useInfiniteList';
import { useIsRefreshing } from '@hooks/useIsRefreshing';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { useLayoutPreference } from '@hooks/useLayoutPreference';
import { useIsDesktop } from '@hooks/useIsDesktop';
import { cn } from '@utils/classNameUtils';
import { DIMMABLE_CLASS, DIMMED_CLASS } from '@utils/motionUtils';
import FunkoListEmpty from './components/FunkoListEmpty';
import FunkoListToolbar from './components/FunkoListToolbar';
import FunkoResultsGrid from './components/FunkoResultsGrid';
import FunkoTable from './components/FunkoTable';
import type { loader } from './funkoListLoader';
import { FUNKO_LAYOUT_STORAGE_KEY } from '@utils/layoutUtils';
import { useFunkoListParams } from './hooks/useFunkoListParams';

type FunkoListLoaderData = LoaderDataUtil<typeof loader> | undefined;

const funkoKeyOf = (funko: FunkoApiModel) => funko.id;

function funkosPageOf(loaderData: unknown) {
  return (loaderData as FunkoListLoaderData)?.funkosResponse;
}

function DesktopActions() {
  return (
    <>
      <LinkButton to={ADD_ROUTES_PATHS.BASE} variant="outline">
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.MANUAL} aria-label="New funko">
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
  const funkos = useInfiniteList({ firstPage: funkosResponse, pageOf: funkosPageOf, keyOf: funkoKeyOf });
  const hasFunkos = funkos.items.length > 0;
  const isFiltered = chips.length > 0 || query.length > 0;

  // On phones the Add flow opened from here is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={PAGE_ICONS.FUNKOS}
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
          <FunkoResultsGrid funkos={funkos.items} density={density} isLoadingMore={funkos.isLoading} />
        ) : null}

        {hasFunkos && !density ? <FunkoTable funkos={funkos.items} isLoadingMore={funkos.isLoading} /> : null}

        <InfiniteListFooter
          shownCount={funkos.items.length}
          total={funkos.total}
          hasMore={funkos.hasMore}
          isLoading={funkos.isLoading}
          noun="funkos"
          onLoadMore={funkos.loadMore}
        />
      </div>
      <AddFab />
    </div>
  );
}

export default FunkoList;
