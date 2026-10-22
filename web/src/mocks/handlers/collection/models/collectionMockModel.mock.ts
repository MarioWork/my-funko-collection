import type { CollectionApiModel } from '@app-types/models';
import { mockDate } from '@mocks/mockStore';

export const createCollectionMockModel = (overrides?: Partial<CollectionApiModel>): CollectionApiModel => ({
  id: 1,
  name: 'Owned',
  notes: null,
  isDefault: true,
  itemCount: 15,
  totalQuantity: 16,
  totalSpentCents: 25384,
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createCollectionMockModelList = (
  length: number,
  overrides?: Partial<CollectionApiModel>,
): CollectionApiModel[] =>
  Array.from({ length }, (_, index) =>
    createCollectionMockModel({ id: index + 1, name: `Collection ${index + 1}`, isDefault: index === 0, ...overrides }),
  );
