export interface CategoryApiModel {
  id: number;
  name: string;
  funkoCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryId = CategoryApiModel['id'];
