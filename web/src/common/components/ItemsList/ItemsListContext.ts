import { createContext } from 'react';
import type {
  CategoryApiModel,
  CollectionApiModel,
  CollectionId,
  CollectionItemApiModel,
  CollectionItemId,
  TagApiModel,
} from '@app-types/models';

// What every part of the list needs: the filter options, and the move and remove actions with the item they are
// working on. Shared through context so the rows and the toolbar read it without passing it down each level.
export type ItemsListContextValue = {
  categories: CategoryApiModel[];
  tags: TagApiModel[];
  collections: CollectionApiModel[];
  hasCollectionFilter: boolean;
  busyItemId: CollectionItemId | undefined;
  move: (item: CollectionItemApiModel, toCollectionId: CollectionId) => void;
  remove: (item: CollectionItemApiModel) => void;
};

export const ItemsListContext = createContext<ItemsListContextValue>({
  categories: [],
  tags: [],
  collections: [],
  hasCollectionFilter: false,
  busyItemId: undefined,
  move: () => undefined,
  remove: () => undefined,
});
