import { createContext } from 'react';

// Whether the rows may be renamed and deleted. ManageListPage provides it, so its page (CategoryList, SeriesList,
// TagList) decides once and the rows read it without passing it down each level. Editable unless told otherwise.
export type ManageListContextValue = {
  canEdit: boolean;
};

export const ManageListContext = createContext<ManageListContextValue>({ canEdit: true });
