import { Pencil, Plus } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS, COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import AddFab from '@components/AddFab';
import ItemsList from '@components/ItemsList';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import { formatCents } from '@utils/moneyUtils';
import type { loader } from './collectionDetailLoader';

function CollectionDetail() {
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { collection } = data;
  const id = String(collection.id);
  const summary = `${collection.itemCount} funkos · ${collection.totalQuantity} pieces · ${formatCents(collection.totalSpentCents)} spent`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={collection.name}
        description={collection.notes ? `${collection.notes} · ${summary}` : summary}
        backTo={COLLECTION_ROUTES_PATHS.BASE}
        backLabel="Collections"
        actions={
          <>
            <LinkButton to={COLLECTION_ROUTES_PATHS.edit(id)} variant="outline">
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit
            </LinkButton>
            <LinkButton to={COLLECTION_ROUTES_PATHS.addItem(id)}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add item
            </LinkButton>
          </>
        }
      />
      <ItemsList
        itemsResponse={data.itemsResponse}
        page={data.page}
        pageSize={data.pageSize}
        sort={data.sort}
        categories={data.categories}
        tags={data.tags}
        collections={data.collections}
        hasCollectionFilter={false}
        emptyTitle={`Nothing in ${collection.name} yet`}
        emptyDescription="Scan a box or pick a funko from the catalog."
        emptyAction={
          <>
            <LinkButton to={ADD_ROUTES_PATHS.BASE}>Scan a barcode</LinkButton>
            <LinkButton to={COLLECTION_ROUTES_PATHS.addItem(id)} variant="outline">
              Pick from the catalog
            </LinkButton>
          </>
        }
      />
      <AddFab />
      <Outlet />
    </div>
  );
}

export default CollectionDetail;
