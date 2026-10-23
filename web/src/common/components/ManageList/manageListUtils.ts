export type ManageRow = {
  id: number;
  name: string;
  notes: string | null;
  // "12 funkos", "3 items": what the row is attached to.
  meta: string;
  isDeletable: boolean;
  deleteDescription: string;
};
