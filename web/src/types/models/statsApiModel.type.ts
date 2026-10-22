export interface CollectionStatsApiModel {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
}

export interface CategoryStatsApiModel {
  id: number;
  name: string;
  funkoCount: number;
}

export interface StatsApiModel {
  funkoCount: number;
  categoryCount: number;
  tagCount: number;
  imageCount: number;
  imageBytes: number;
  collections: CollectionStatsApiModel[];
  byCategory: CategoryStatsApiModel[];
}
