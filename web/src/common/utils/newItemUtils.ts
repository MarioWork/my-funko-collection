import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';

const NEW_ITEM_QUANTITY = 1;

// A funko filed in a collection without details yet: one copy, nothing else known. Add, Edit and the funko page's
// collection buttons all start an item this way.
export function newItemPayload(funkoId: number, tagIds: number[] = []): CreateCollectionItem {
  return {
    funkoId,
    quantity: NEW_ITEM_QUANTITY,
    condition: null,
    purchasePriceCents: null,
    purchaseCurrency: undefined,
    purchasedAt: null,
    notes: null,
    tagIds,
  };
}
