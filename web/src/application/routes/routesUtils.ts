// Every route path in one place. Route files, navigation and `navigate()` calls import these, never a literal.
export const BASE_ROUTES_PATHS = {
  ROOT: '/',
  HOME: '/home',
  SEARCH: '/search',
  SETTINGS: '/settings',
};

export const FUNKO_ROUTES_PATHS = {
  BASE: '/funkos',
  detail: (funkoId?: string) => (funkoId ? `/funkos/${funkoId}` : '/funkos/:funkoId'),
  edit: (funkoId?: string) => (funkoId ? `/funkos/${funkoId}/edit` : '/funkos/:funkoId/edit'),
  // One of its collection items, edited in place over the funko's page (the same sheet as on the collection page).
  editItem: (funkoId?: string, collectionId?: string, itemId?: string) =>
    funkoId && collectionId && itemId
      ? `/funkos/${funkoId}/collections/${collectionId}/items/${itemId}/edit`
      : '/funkos/:funkoId/collections/:collectionId/items/:itemId/edit',
  delete: (funkoId?: string) => (funkoId ? `/funkos/${funkoId}/delete` : '/funkos/:funkoId/delete'),
  images: (funkoId?: string) => (funkoId ? `/funkos/${funkoId}/images` : '/funkos/:funkoId/images'),
  membership: (funkoId?: string) => (funkoId ? `/funkos/${funkoId}/membership` : '/funkos/:funkoId/membership'),
  image: (funkoId?: string, imageId?: string) =>
    funkoId && imageId ? `/funkos/${funkoId}/images/${imageId}` : '/funkos/:funkoId/images/:imageId',
};

export const ADD_ROUTES_PATHS = {
  BASE: '/add',
  MANUAL: '/add/manual',
  // Children of a page (Home, Funkos): the same flow as a dialog over that page on desktop.
  NESTED_FORM: 'add',
  NESTED_SCAN: 'scan',
};

export const COLLECTION_ROUTES_PATHS = {
  BASE: '/collections',
  ADD: 'add',
  detail: (collectionId?: string) => (collectionId ? `/collections/${collectionId}` : '/collections/:collectionId'),
  edit: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/edit` : '/collections/:collectionId/edit',
  delete: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/delete` : '/collections/:collectionId/delete',
  setDefault: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/default` : '/collections/:collectionId/default',
  items: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/items` : '/collections/:collectionId/items',
  // Action only: the Undo of a removed item.
  restoreItem: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/items/restore` : '/collections/:collectionId/items/restore',
  editItem: (collectionId?: string, itemId?: string) =>
    collectionId && itemId
      ? `/collections/${collectionId}/items/${itemId}/edit`
      : '/collections/:collectionId/items/:itemId/edit',
  moveItem: (collectionId?: string, itemId?: string) =>
    collectionId && itemId
      ? `/collections/${collectionId}/items/${itemId}/move`
      : '/collections/:collectionId/items/:itemId/move',
  deleteItem: (collectionId?: string, itemId?: string) =>
    collectionId && itemId
      ? `/collections/${collectionId}/items/${itemId}/delete`
      : '/collections/:collectionId/items/:itemId/delete',
};

export const ITEM_ROUTES_PATHS = {
  BASE: '/items',
};

export const CATEGORY_ROUTES_PATHS = {
  BASE: '/categories',
  ADD: 'add',
  update: (categoryId?: string) => (categoryId ? `/categories/${categoryId}` : '/categories/:categoryId'),
};

export const SERIES_ROUTES_PATHS = {
  BASE: '/series',
  ADD: 'add',
  update: (seriesId?: string) => (seriesId ? `/series/${seriesId}` : '/series/:seriesId'),
};

export const TAG_ROUTES_PATHS = {
  BASE: '/tags',
  ADD: 'add',
  update: (tagId?: string) => (tagId ? `/tags/${tagId}` : '/tags/:tagId'),
};

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
