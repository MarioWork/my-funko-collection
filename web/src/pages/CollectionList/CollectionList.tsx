import { FolderPlus } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS, ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import PageHeader from '@components/PageHeader';
import CollectionCard from './components/CollectionCard';
import type { loader } from './collectionListLoader';

function CollectionList() {
  const { collections } = useLoaderData<LoaderDataUtil<typeof loader>>();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Collections"
        description="Your lists: what you own, what you want, what you sell."
        actions={
          <>
            <LinkButton to={ITEM_ROUTES_PATHS.BASE} variant="outline">
              All items
            </LinkButton>
            <LinkButton to={COLLECTION_ROUTES_PATHS.ADD}>
              <FolderPlus data-icon="inline-start" aria-hidden="true" />
              New collection
            </LinkButton>
          </>
        }
      />
      <ul className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </ul>
      <Outlet />
    </div>
  );
}

export default CollectionList;
