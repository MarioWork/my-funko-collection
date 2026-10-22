export interface TagApiModel {
  id: number;
  name: string;
  notes: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TagId = TagApiModel['id'];
