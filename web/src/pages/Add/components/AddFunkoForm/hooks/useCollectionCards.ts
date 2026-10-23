import { useState } from 'react';
import type { CollectionId } from '@app-types/models';
import { withViewTransition } from '@utils/viewTransitionUtils';

// The collections picked on the Add page and which of their cards are unfolded. On arrival only the first card is
// open; a newly picked collection opens and folds the others, so the one being filled in is the one in view.
// Changes glide (a View Transition), so cards appearing, going or folding never jump.
export function useCollectionCards(initialCollectionIds: CollectionId[]) {
  const [collectionIds, setCollectionIds] = useState<CollectionId[]>(initialCollectionIds);
  const [openIds, setOpenIds] = useState<CollectionId[]>(initialCollectionIds.slice(0, 1));

  const changeCollections = (nextIds: CollectionId[]) => {
    const addedIds = nextIds.filter((collectionId) => !collectionIds.includes(collectionId));
    const hasAdded = addedIds.length > 0;

    void withViewTransition(() => {
      if (hasAdded) setOpenIds(addedIds);

      setCollectionIds(nextIds);
    });
  };

  const toggle = (collectionId: CollectionId) =>
    setOpenIds((current) =>
      current.includes(collectionId) ? current.filter((openId) => openId !== collectionId) : [...current, collectionId],
    );

  // A card that did not pass its checks opens, so its error is seen.
  const open = (collectionId: CollectionId) =>
    setOpenIds((current) => (current.includes(collectionId) ? current : [...current, collectionId]));

  return { collectionIds, openIds, changeCollections, toggle, open };
}
