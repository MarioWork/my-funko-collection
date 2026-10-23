import { useRef } from 'react';
import type { CollectionId } from '@app-types/models';
import { toItemPayload, type ItemFormValues } from '@components/ItemFormFields';
import type { AddItem } from '../../../addUtils';

// How the form reaches one collection card's own little form: check it (showing its errors) and read it.
export type ItemFormHandle = {
  read: () => Promise<ItemFormValues | null>;
};

type Unregister = () => void;

// Each collection card owns a form of its own (the same fields as editing an item). Save asks every card for its
// values at once; a card that does not pass its checks shows its errors and stops the save.
export function useItemForms() {
  const handles = useRef(new Map<CollectionId, ItemFormHandle>());

  const register = (collectionId: CollectionId, handle: ItemFormHandle): Unregister => {
    handles.current.set(collectionId, handle);

    return () => handles.current.delete(collectionId);
  };

  const readItem = async (collectionId: CollectionId): Promise<AddItem | null> => {
    const values = await handles.current.get(collectionId)?.read();

    if (!values) return null;

    return { ...toItemPayload(values), collectionId };
  };

  // Every card is read (so each shows its own errors); null when any of them did not pass.
  const readItems = async (collectionIds: CollectionId[]): Promise<AddItem[] | null> => {
    const items = await Promise.all(collectionIds.map(readItem));
    const validItems = items.filter((item): item is AddItem => item !== null);
    const isEveryCardValid = validItems.length === items.length;

    if (!isEveryCardValid) return null;

    return validItems;
  };

  return { register, readItems };
}
