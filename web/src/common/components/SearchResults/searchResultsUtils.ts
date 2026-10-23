import type { NamedApiModel } from '@app-types/models';
import { COLLECTION_ROUTES_PATHS, FUNKO_ROUTES_PATHS, ITEM_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import { funkosInCategoryPath } from '@utils/funkoLinkUtils';

export type SearchGroup = {
  heading: string;
  entries: NamedApiModel[];
  toPath: (entry: NamedApiModel) => string;
};

// Where each kind of hit leads: a category filters the catalog, a tag filters all items, a collection opens.
export const categoryPath = (category: NamedApiModel) => funkosInCategoryPath(category.id);

export const collectionPath = (collection: NamedApiModel) => COLLECTION_ROUTES_PATHS.detail(String(collection.id));

export const tagPath = (tag: NamedApiModel) => `${ITEM_ROUTES_PATHS.BASE}?${ItemApiSearchFields.TAG_ID}=${tag.id}`;

export const allFunkosPath = (query: string) =>
  `${FUNKO_ROUTES_PATHS.BASE}?${FunkoApiSearchFields.QUERY}=${encodeURIComponent(query)}`;
