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
};

export const COLLECTION_ROUTES_PATHS = {
  BASE: '/collections',
  ADD: 'add',
  detail: (collectionId?: string) => (collectionId ? `/collections/${collectionId}` : '/collections/:collectionId'),
  // From the collection's own page: the dialog opens over it.
  edit: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/edit` : '/collections/:collectionId/edit',
  // From the list: the dialog opens over the list. The static "edit" segment outranks the detail page's
  // `:collectionId`, so this never lands on a collection's page.
  editInList: (collectionId?: string) =>
    collectionId ? `/collections/edit/${collectionId}` : '/collections/edit/:collectionId',
  delete: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/delete` : '/collections/:collectionId/delete',
  setDefault: (collectionId?: string) =>
    collectionId ? `/collections/${collectionId}/default` : '/collections/:collectionId/default',
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

// Every stored image, read-only.
export const IMAGE_ROUTES_PATHS = {
  BASE: '/images',
};

// What the signed-in member sent in: their submissions, each with its state, and sending a rejected one again.
// REVIEW is the admins' Submissions page (every member's, Waiting and Done), with its approve and reject actions.
export const SUBMISSION_ROUTES_PATHS = {
  BASE: '/submissions',
  REVIEW: '/submissions/review',
  approve: (funkoId?: string) =>
    funkoId ? `/submissions/review/${funkoId}/approval` : '/submissions/review/:funkoId/approval',
  reject: (funkoId?: string) =>
    funkoId ? `/submissions/review/${funkoId}/rejection` : '/submissions/review/:funkoId/rejection',
  resend: (funkoId?: string) =>
    funkoId ? `/submissions/${funkoId}/resubmission` : '/submissions/:funkoId/resubmission',
};

// Admins only: every user, the dialog that creates one, and the one that manages one (role, a new temporary
// password, delete).
export const USER_ROUTES_PATHS = {
  BASE: '/users',
  ADD: 'add',
  manage: (userId?: string) => (userId ? `/users/${userId}` : '/users/:userId'),
};

// The Users page's route: the manage dialog reads the user from its list instead of asking the API again.
export const USER_LIST_ROUTE_ID = 'users';

export const TAG_ROUTES_PATHS = {
  BASE: '/tags',
  ADD: 'add',
  update: (tagId?: string) => (tagId ? `/tags/${tagId}` : '/tags/:tagId'),
};

// Sign-in, first run and choosing your own password (after signing in with a temporary one) render outside the app
// shell; the rest are action-only routes behind Settings → Security.
export const AUTH_ROUTES_PATHS = {
  LOGIN: '/login',
  SETUP: '/setup',
  SET_PASSWORD: '/set-password',
  SIGN_OUT: '/sign-out',
  SIGN_OUT_EVERYWHERE: '/sign-out-everywhere',
  PASSKEYS: '/settings/passkeys',
  PASSWORD: '/settings/password',
  passkey: (passkeyId?: string) => (passkeyId ? `/settings/passkeys/${passkeyId}` : '/settings/passkeys/:passkeyId'),
};

// Search params of the auth pages: where to go back to after signing in, and the first-run setup code.
export const AUTH_SEARCH_PARAMS = {
  REDIRECT_TO: 'redirectTo',
  CODE: 'code',
} as const;

// The app shell's route: its loader holds the signed-in user (useSignedInUser).
export const APP_SHELL_ROUTE_ID = 'app';

export const defaultRedirectRoute = BASE_ROUTES_PATHS.HOME;
