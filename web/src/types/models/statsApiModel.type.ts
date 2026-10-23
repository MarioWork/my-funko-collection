import type { CategoryStatsApiModel } from './categoryStatsApiModel.type';
import type { CollectionStatsApiModel } from './collectionStatsApiModel.type';

export interface StatsApiModel {
  funkoCount: number;
  categoryCount: number;
  tagCount: number;
  imageCount: number;
  imageBytes: number;
  collections: CollectionStatsApiModel[];
  byCategory: CategoryStatsApiModel[];
}
