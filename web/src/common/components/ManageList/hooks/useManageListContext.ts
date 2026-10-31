import { use } from 'react';
import { ManageListContext, type ManageListContextValue } from '../ManageListContext';

export function useManageListContext(): ManageListContextValue {
  return use(ManageListContext);
}
