import type { RouteObject } from 'react-router';
import { COLLECTION_ROUTES_PATHS, ITEM_ROUTES_PATHS } from '../routesUtils';

const collectionDialog = () => import('@pages/CollectionList/components/CollectionDialog/CollectionDialog.route');

export const collectionRoutes: RouteObject[] = [
  {
    path: COLLECTION_ROUTES_PATHS.BASE,
    lazy: () => import('@pages/CollectionList/CollectionList.route'),
    children: [{ path: COLLECTION_ROUTES_PATHS.ADD, lazy: collectionDialog }],
  },
  {
    path: COLLECTION_ROUTES_PATHS.detail(),
    lazy: () => import('@pages/CollectionDetail/CollectionDetail.route'),
    children: [
      // The edit dialog is reachable from the list and from the collection's own page.
      { path: COLLECTION_ROUTES_PATHS.edit(), lazy: collectionDialog },
      {
        path: COLLECTION_ROUTES_PATHS.editItem(),
        lazy: () => import('@pages/CollectionDetail/components/EditItemSheet/EditItemSheet.route'),
      },
    ],
  },
  {
    path: COLLECTION_ROUTES_PATHS.delete(),
    lazy: { action: async () => (await import('@pages/CollectionList/collectionListActions')).deleteCollectionAction },
  },
  {
    path: COLLECTION_ROUTES_PATHS.setDefault(),
    lazy: {
      action: async () => (await import('@pages/CollectionList/collectionListActions')).setDefaultCollectionAction,
    },
  },
  {
    path: COLLECTION_ROUTES_PATHS.restoreItem(),
    lazy: { action: async () => (await import('@pages/CollectionDetail/collectionDetailActions')).restoreItemAction },
  },
  {
    path: COLLECTION_ROUTES_PATHS.moveItem(),
    lazy: { action: async () => (await import('@pages/CollectionDetail/collectionDetailActions')).moveItemAction },
  },
  {
    path: COLLECTION_ROUTES_PATHS.deleteItem(),
    lazy: { action: async () => (await import('@pages/CollectionDetail/collectionDetailActions')).deleteItemAction },
  },
  // Editing from /items opens the collection's own sheet; closing it goes back here.
  { path: ITEM_ROUTES_PATHS.BASE, lazy: () => import('@pages/AllItems/AllItems.route') },
];
