import { Pencil } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import ItemsList from '@components/ItemsList';
import LinkButton from '@components/LinkButton';
import { useReadOnlyReason } from '@hooks/useReadOnlyReason';
import { useGoBack } from '@hooks/useGoBack';
import { useMobileChildPage } from '@hooks/useMobileChildPage';
import { formatCents } from '@utils/moneyUtils';
import type { loader } from './collectionDetailLoader';

function CollectionDetail() {
  const childPage = useMobileChildPage();
  const data = useLoaderData<LoaderDataUtil<typeof loader>>();
  // Back to wherever the collection was opened from; the Collections list for a shared link.
  const goBack = useGoBack(COLLECTION_ROUTES_PATHS.BASE);
  const readOnlyReason = useReadOnlyReason();
  const { collection } = data;
  const id = String(collection.id);
  const summary = `${collection.itemCount} funkos · ${collection.totalQuantity} pieces · ${formatCents(collection.totalSpentCents)} total`;

  // On phones a form (edit the collection or an item) is its own page.
  if (childPage) return childPage;

  return (
    <div className="flex flex-col gap-4">
      <ItemsList
        header={{
          title: collection.name,
          description: collection.notes ? `${collection.notes} · ${summary}` : summary,
          onBack: goBack,
          actions: (
            <LinkButton to={COLLECTION_ROUTES_PATHS.edit(id)} variant="outline" disabledReason={readOnlyReason}>
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit
            </LinkButton>
          ),
        }}
        itemsResponse={data.itemsResponse}
        page={data.page}
        pageSize={data.pageSize}
        sort={data.sort}
        categories={data.categories}
        tags={data.tags}
        collections={data.collections}
        hasCollectionFilter={false}
        emptyTitle={`Nothing in ${collection.name} yet`}
        emptyDescription="Add funkos to it from a funko's page: the bookmark and heart by its name, or ⋯ → Lists."
      />
      <Outlet />
    </div>
  );
}

export default CollectionDetail;
