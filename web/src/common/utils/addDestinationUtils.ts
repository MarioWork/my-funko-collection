import type { CollectionApiModel, CollectionId, TagId } from '@app-types/models';

// Where new funkos go, remembered across visits: "Owned, Wishlist · Box 3". Also edited in Settings.
// The collection key holds a comma list of ids (older visits stored a single id, which still parses).
export const ADD_COLLECTION_STORAGE_KEY = 'add.collectionId';
export const ADD_TAGS_STORAGE_KEY = 'add.tagIds';
export const ADD_CATEGORY_STORAGE_KEY = 'add.categoryId';

// Stored in place of collection ids when new funkos should only be registered in the catalog.
export const CATALOG_ONLY_VALUE = 'none';

// An empty `collectionIds` means "just the catalog": the funko is created, no item is filed anywhere.
export type AddDestination = {
  collectionIds: CollectionId[];
  tagIds: TagId[];
};

export function parseStoredIds(raw: string): number[] {
  return raw
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function defaultCollectionId(collections: CollectionApiModel[]): CollectionId | undefined {
  return (collections.find((collection) => collection.isDefault) ?? collections[0])?.id;
}
