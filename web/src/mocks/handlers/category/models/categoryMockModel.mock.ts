import type { CategoryApiModel } from '@app-types/models';
import { mockDate } from '@mocks/mockStore';

export const createCategoryMockModel = (overrides?: Partial<CategoryApiModel>): CategoryApiModel => ({
  id: 1,
  name: 'Pop! Marvel',
  funkoCount: 8,
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createCategoryMockModelList = (
  length: number,
  overrides?: Partial<CategoryApiModel>,
): CategoryApiModel[] =>
  Array.from({ length }, (_, index) =>
    createCategoryMockModel({ id: index + 1, name: `Pop! Line ${index + 1}`, ...overrides }),
  );
