import { Plus, ScanBarcode } from 'lucide-react';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import FunkoCard from '@components/FunkoCard';
import FunkoGrid from '@components/FunkoGrid';
import LinkButton from '@components/LinkButton';
import ListPagination from '@components/ListPagination';
import PageHeader from '@components/PageHeader';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { useIsDesktop } from '@hooks/useMediaQuery';
import FunkoListEmpty from './components/FunkoListEmpty';
import FunkoListToolbar from './components/FunkoListToolbar';
import FunkoTable from './components/FunkoTable';
import { FUNKO_DENSITY_STORAGE_KEY, FUNKO_VIEW_STORAGE_KEY, FunkoDensityUtil, FunkoViewUtil } from './funkoListUtils';
import { useFunkoListParams } from './hooks/useFunkoListParams';

function DesktopActions() {
  return (
    <>
      <LinkButton to={ADD_ROUTES_PATHS.MANUAL} variant="outline">
        <Plus data-icon="inline-start" aria-hidden="true" />
        Add
      </LinkButton>
      <LinkButton to={ADD_ROUTES_PATHS.BASE}>
        <ScanBarcode data-icon="inline-start" aria-hidden="true" />
        Scan
      </LinkButton>
    </>
  );
}

function FunkoList() {
  const { data, query, chips, clearFilters } = useFunkoListParams();
  const [view, setView] = useLocalStorage<FunkoViewUtil>(FUNKO_VIEW_STORAGE_KEY, FunkoViewUtil.GRID);
  const [density, setDensity] = useLocalStorage<FunkoDensityUtil>(
    FUNKO_DENSITY_STORAGE_KEY,
    FunkoDensityUtil.COMFORTABLE,
  );
  const isDesktop = useIsDesktop();
  const { funkosResponse } = data;
  const hasFunkos = funkosResponse.data.length > 0;
  const isFiltered = chips.length > 0 || query.length > 0;
  const isGrid = view === FunkoViewUtil.GRID;

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
      />
      <FunkoListToolbar view={view} density={density} onViewChange={setView} onDensityChange={setDensity} />

      {!hasFunkos ? <FunkoListEmpty isFiltered={isFiltered} onClearFilters={clearFilters} /> : null}

      {hasFunkos && isGrid ? (
        <FunkoGrid label="Funkos" density={density}>
          {funkosResponse.data.map((funko) => (
            <li key={funko.id}>
              <FunkoCard funko={funko} density={density} />
            </li>
          ))}
        </FunkoGrid>
      ) : null}

      {hasFunkos && !isGrid ? <FunkoTable funkos={funkosResponse.data} /> : null}

      <ListPagination page={data.page} size={data.pageSize} total={funkosResponse.totalResultNumber} />
      <AddFab />
    </div>
  );
}

export default FunkoList;
