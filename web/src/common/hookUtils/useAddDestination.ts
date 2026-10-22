import type { CollectionApiModel, NamedApiModel } from '@app-types/models';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  ADD_CATEGORY_STORAGE_KEY,
  ADD_COLLECTION_STORAGE_KEY,
  ADD_TAGS_STORAGE_KEY,
  CATALOG_ONLY_VALUE,
  defaultCollectionId,
  parseStoredIds,
  type AddDestination,
} from '@utils/addDestinationUtils';

type Options = {
  collections: CollectionApiModel[];
  tags: NamedApiModel[];
};

// The destination chosen once and kept: a collection (or just the catalog), tags, and the last category used.
// Shared by Add and Settings.
export function useAddDestination({ collections, tags }: Options) {
  const [storedCollection, setStoredCollection] = useLocalStorage<string>(ADD_COLLECTION_STORAGE_KEY, '');
  const [storedTags, setStoredTags] = useLocalStorage<string>(ADD_TAGS_STORAGE_KEY, '');
  const [storedCategory, setStoredCategory] = useLocalStorage<string>(ADD_CATEGORY_STORAGE_KEY, '');

  const isCatalogOnly = storedCollection === CATALOG_ONLY_VALUE;
  const isStoredKnown = collections.some((collection) => String(collection.id) === storedCollection);
  const chosenCollectionId = isStoredKnown ? Number(storedCollection) : defaultCollectionId(collections);
  const collectionId = isCatalogOnly ? null : (chosenCollectionId ?? null);
  // Tags belong to items, so "just the catalog" carries none.
  const tagIds = isCatalogOnly
    ? []
    : parseStoredIds(storedTags).filter((tagId) => tags.some((tag) => tag.id === tagId));
  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));
  const collection = collections.find((candidate) => candidate.id === collectionId);
  const destination: AddDestination = { collectionId, tagIds };

  return {
    destination,
    collection,
    selectedTags,
    lastCategoryId: storedCategory,
    isCatalogOnly,
    setCollectionId: (id: number | null) => setStoredCollection(id === null ? CATALOG_ONLY_VALUE : String(id)),
    setTags: (next: NamedApiModel[]) => setStoredTags(next.map((tag) => tag.id).join(',')),
    rememberCategory: (id: string) => setStoredCategory(id),
  };
}
