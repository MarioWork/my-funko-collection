import { createContext } from 'react';

// Whether the rows may be renamed and deleted. ManageListPage provides it, so its page (CategoryList, SeriesList,
// TagList) decides once and the rows read it without passing it down each level. Read-only unless told otherwise:
// a row rendered without the provider never offers a write the API would refuse.
export type ManageListContextValue = {
  canEdit: boolean;
};

export const ManageListContext = createContext<ManageListContextValue>({ canEdit: false });
