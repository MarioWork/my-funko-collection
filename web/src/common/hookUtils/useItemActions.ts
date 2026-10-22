import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { CollectionItemApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useActionToast } from '@hooks/useActionToast';
import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';
import { createFormData } from '@utils/formDataUtils';

type PendingKind = 'move' | 'remove' | 'restore';

type Pending = { kind: PendingKind; item: CollectionItemApiModel };

const SUCCESS_MESSAGE_MAP: Record<PendingKind, (name: string) => string> = {
  move: (name) => `Moved ${name}`,
  remove: (name) => `Removed ${name}`,
  restore: (name) => `Put ${name} back`,
};

// Everything the removed item had, so Undo re-adds it as it was.
function toSnapshot(item: CollectionItemApiModel): CreateCollectionItem {
  return {
    funkoId: item.funko.id,
    quantity: item.quantity,
    condition: item.condition,
    purchasePriceCents: item.purchasePriceCents,
    purchaseCurrency: item.purchaseCurrency,
    purchasedAt: item.purchasedAt,
    notes: item.notes,
    tagIds: item.tags.map((tag) => tag.id),
  };
}

// Move and remove for the items of a list, owned by the list itself: a row that is removed unmounts before its
// own fetcher settles, so the toast (and its Undo) must live one level up, in something that stays on screen.
export function useItemActions() {
  const fetcher = useFetcher<JSONResponseUtil>();
  const [pending, setPending] = useState<Pending | null>(null);
  const busyItemId = fetcher.state === 'idle' ? undefined : pending?.item.id;

  const restore = (item: CollectionItemApiModel) => {
    setPending({ kind: 'restore', item });
    void fetcher.submit(createFormData({ item: toSnapshot(item) }), {
      method: HttpVerbsUtil.POST,
      action: COLLECTION_ROUTES_PATHS.addItem(String(item.collection.id)),
    });
  };

  const move = (item: CollectionItemApiModel, toCollectionId: number) => {
    setPending({ kind: 'move', item });
    void fetcher.submit(createFormData({ toCollectionId }), {
      method: HttpVerbsUtil.POST,
      action: COLLECTION_ROUTES_PATHS.moveItem(String(item.collection.id), String(item.id)),
    });
  };

  const remove = (item: CollectionItemApiModel) => {
    setPending({ kind: 'remove', item });
    void fetcher.submit(null, {
      method: HttpVerbsUtil.DELETE,
      action: COLLECTION_ROUTES_PATHS.deleteItem(String(item.collection.id), String(item.id)),
    });
  };

  useActionToast(fetcher, {
    successMessage: () => (pending ? SUCCESS_MESSAGE_MAP[pending.kind](pending.item.funko.name) : 'Done'),
    undo: pending?.kind === 'remove' ? { onUndo: () => restore(pending.item) } : undefined,
  });

  return { busyItemId, move, remove };
}
