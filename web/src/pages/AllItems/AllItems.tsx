import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS, COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import ItemsList from '@components/ItemsList';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import type { loader } from './allItemsLoader';

// Every item across every collection: "everything in Box 3", whatever list it is in.
function AllItems() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="All items"
        description="Across every collection. Filter by tag to find a box."
        backTo={COLLECTION_ROUTES_PATHS.BASE}
        backLabel="Collections"
      />
      <ItemsList
        itemsResponse={data.itemsResponse}
        page={data.page}
        pageSize={data.pageSize}
        sort={data.sort}
        categories={data.categories}
        tags={data.tags}
        collections={data.collections}
        hasCollectionFilter
        emptyTitle="No items yet"
        emptyDescription="Add a funko to a collection and it shows up here."
        emptyAction={<LinkButton to={ADD_ROUTES_PATHS.BASE}>Scan a barcode</LinkButton>}
      />
      <Outlet />
    </div>
  );
}

export default AllItems;
