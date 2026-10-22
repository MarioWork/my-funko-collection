import type { StatsApiModel } from '@app-types/models';

export const createStatsMockModel = (overrides?: Partial<StatsApiModel>): StatsApiModel => ({
  funkoCount: 30,
  categoryCount: 5,
  tagCount: 3,
  imageCount: 60,
  imageBytes: 21_000_000,
  collections: [
    { id: 1, name: 'Owned', isDefault: true, itemCount: 15, totalQuantity: 16, totalSpentCents: 25384 },
    { id: 2, name: 'Wishlist', isDefault: false, itemCount: 5, totalQuantity: 5, totalSpentCents: 0 },
  ],
  byCategory: [
    { id: 4, name: 'Pop! Animation', funkoCount: 6 },
    { id: 5, name: 'Pop! Games', funkoCount: 5 },
    { id: 1, name: 'Pop! Marvel', funkoCount: 8 },
    { id: 2, name: 'Pop! Television', funkoCount: 5 },
    { id: 3, name: 'Star Wars', funkoCount: 6 },
  ],
  ...overrides,
});
