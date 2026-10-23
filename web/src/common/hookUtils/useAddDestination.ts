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

function knownCollectionIds(storedCollections: string, collections: CollectionApiModel[]): number[] {
  if (storedCollections === CATALOG_ONLY_VALUE) return [];

  const known = parseStoredIds(storedCollections).filter((collectionId) =>
    collections.some((collection) => collection.id === collectionId),
  );

  if (known.length > 0) return known;

  // Nothing stored yet, or every stored list was deleted: start from the default collection.
  const fallback = defaultCollectionId(collections);

  return fallback === undefined ? [] : [fallback];
}

// The destination chosen once and kept: collections (none = just the catalog), tags, and the last category used.
// Shared by Add and Settings.
export function useAddDestination({ collections, tags }: Options) {
  const [storedCollections, setStoredCollections] = useLocalStorage<string>(ADD_COLLECTION_STORAGE_KEY, '');
  const [storedTags, setStoredTags] = useLocalStorage<string>(ADD_TAGS_STORAGE_KEY, '');
  const [storedCategory, setStoredCategory] = useLocalStorage<string>(ADD_CATEGORY_STORAGE_KEY, '');

  const collectionIds = knownCollectionIds(storedCollections, collections);
  const isCatalogOnly = collectionIds.length === 0;
  // Tags belong to items, so "just the catalog" carries none.
  const tagIds = isCatalogOnly
    ? []
    : parseStoredIds(storedTags).filter((tagId) => tags.some((tag) => tag.id === tagId));
  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));
  const selectedCollections = collections.filter((collection) => collectionIds.includes(collection.id));
  const destination: AddDestination = { collectionIds, tagIds };

  const setCollectionIds = (ids: number[]) =>
    setStoredCollections(ids.length === 0 ? CATALOG_ONLY_VALUE : ids.join(','));

  const setTagIds = (ids: number[]) => setStoredTags(ids.join(','));

  return {
    destination,
    selectedCollections,
    selectedTags,
    lastCategoryId: storedCategory,
    isCatalogOnly,
    setCollectionIds,
    setTags: (next: NamedApiModel[]) => setTagIds(next.map((tag) => tag.id)),
    remember: ({ collectionIds: nextCollectionIds, tagIds: nextTagIds }: AddDestination) => {
      setCollectionIds(nextCollectionIds);
      setTagIds(nextTagIds);
    },
    rememberCategory: (id: string) => setStoredCategory(id),
  };
}
