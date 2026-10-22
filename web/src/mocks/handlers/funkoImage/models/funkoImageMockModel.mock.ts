import type { FunkoImageApiModel } from '@app-types/models';
import { createMockImageUrls } from '@mocks/mockImageUtils';
import { mockDate } from '@mocks/mockStore';

export const createFunkoImageMockModel = (overrides?: Partial<FunkoImageApiModel>): FunkoImageApiModel => ({
  id: 1,
  position: 0,
  sizeBytes: 350_000,
  createdAt: mockDate(0),
  ...createMockImageUrls('Spider-Man', 0),
  ...overrides,
});

export const createFunkoImageMockModelList = (
  length: number,
  overrides?: Partial<FunkoImageApiModel>,
): FunkoImageApiModel[] =>
  Array.from({ length }, (_, index) => createFunkoImageMockModel({ id: index + 1, position: index, ...overrides }));
