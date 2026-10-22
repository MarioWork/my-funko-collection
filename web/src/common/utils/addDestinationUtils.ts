import type { CollectionApiModel } from '@app-types/models';

// Where scanned funkos go, remembered across visits: "Adding to: Owned · Box 3". Also edited in Settings.
export const ADD_COLLECTION_STORAGE_KEY = 'add.collectionId';
export const ADD_TAGS_STORAGE_KEY = 'add.tagIds';
export const ADD_CATEGORY_STORAGE_KEY = 'add.categoryId';

// Stored in place of a collection id when new funkos should only be registered in the catalog.
export const CATALOG_ONLY_VALUE = 'none';
export const CATALOG_ONLY_LABEL = 'Just the catalog (no collection)';

// `collectionId: null` means "just the catalog": the funko is created, no item is filed anywhere.
export type AddDestination = {
  collectionId: number | null;
  tagIds: number[];
};

export function parseStoredIds(raw: string): number[] {
  return raw
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function defaultCollectionId(collections: CollectionApiModel[]): number | undefined {
  return (collections.find((collection) => collection.isDefault) ?? collections[0])?.id;
}
