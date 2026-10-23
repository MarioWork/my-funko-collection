import { use } from 'react';
import { ItemsListContext, type ItemsListContextValue } from '../ItemsListContext';

export function useItemsListContext(): ItemsListContextValue {
  return use(ItemsListContext);
}
