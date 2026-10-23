import { FolderPlus, LayoutGrid, List, SearchX } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS, ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import EmptyState from '@components/EmptyState';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import SearchInput from '@components/SearchInput';
import SegmentedToggle, { type SegmentedOption } from '@components/SegmentedToggle';
import { Button } from '@components/ui/button';
import { useListParams } from '@hooks/useListParams';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { CollectionApiSearchFields } from '@services/collectionService/collectionService';
import { COLLECTION_LAYOUT_STORAGE_KEY, CollectionLayoutUtil } from './collectionListUtils';
import CollectionCard from './components/CollectionCard';
import CollectionTable from './components/CollectionTable';
import type { loader } from './collectionListLoader';

const LAYOUT_OPTIONS: SegmentedOption<CollectionLayoutUtil>[] = [
  { value: CollectionLayoutUtil.GRID, label: 'Grid', icon: LayoutGrid },
  { value: CollectionLayoutUtil.LIST, label: 'List', icon: List },
];

function CollectionList() {
  const childPage = useMobileChildPage();
  const { collections } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { getParam, setParams } = useListParams();
  const query = getParam(CollectionApiSearchFields.NAME) ?? '';
  const setQuery = (value: string) => setParams({ [CollectionApiSearchFields.NAME]: value });
  const hasNoMatch = query.length > 0 && collections.length === 0;
  const [storedLayout, setLayout] = useLocalStorage<CollectionLayoutUtil>(
    COLLECTION_LAYOUT_STORAGE_KEY,
    CollectionLayoutUtil.GRID,
  );
  // Anything but the list (including an old or hand-edited value) shows the grid.
  const isList = storedLayout === CollectionLayoutUtil.LIST;
  const layout = isList ? CollectionLayoutUtil.LIST : CollectionLayoutUtil.GRID;

  // On phones a form (new collection, add or edit an item) is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Collections"
        description="Your lists: what you own, what you want, what you want to sell…"
        actions={
          <>
            <LinkButton to={ITEM_ROUTES_PATHS.BASE} variant="outline">
              <List data-icon="inline-start" aria-hidden="true" />
              All items
            </LinkButton>
            <LinkButton to={COLLECTION_ROUTES_PATHS.ADD} className="hidden lg:inline-flex">
              <FolderPlus data-icon="inline-start" aria-hidden="true" />
              New collection
            </LinkButton>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            label="Search collections"
            placeholder="Search by name…"
            className="min-w-56 flex-1"
          />
          <SegmentedToggle
            label="Layout"
            options={LAYOUT_OPTIONS}
            value={layout}
            onChange={setLayout}
            labelDisplay="never"
          />
        </div>
      </PageHeader>
      {hasNoMatch ? (
        <EmptyState icon={SearchX} title="No collection with that name" description={`Nothing matches “${query}”.`}>
          <Button variant="outline" onClick={() => setQuery('')}>
            Show all collections
          </Button>
        </EmptyState>
      ) : null}
      {isList ? (
        <CollectionTable>
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} layout={layout} />
          ))}
        </CollectionTable>
      ) : (
        <ul className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} layout={layout} />
          ))}
        </ul>
      )}
      <AddFab to={COLLECTION_ROUTES_PATHS.ADD} label="New collection" />
      <Outlet />
    </div>
  );
}

export default CollectionList;
