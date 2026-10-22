export interface CollectionApiModel {
  id: number;
  name: string;
  notes: string | null;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
  createdAt: string;
  updatedAt: string;
}

export type CollectionId = CollectionApiModel['id'];
