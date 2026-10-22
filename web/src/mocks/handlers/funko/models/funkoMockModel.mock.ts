import type { FunkoApiModel, FunkoSummaryApiModel } from '@app-types/models';
import { FunkoTypeUtil } from '@app-types/utility';
import { createMockImageUrls, toPrimaryImage } from '@mocks/mockImageUtils';
import { mockDate } from '@mocks/mockStore';

export const createFunkoSummaryMockModel = (overrides?: Partial<FunkoSummaryApiModel>): FunkoSummaryApiModel => ({
  id: 1,
  name: 'Spider-Man',
  number: '03',
  type: FunkoTypeUtil.POP,
  isChase: false,
  exclusive: '',
  barcode: '889698624008',
  category: { id: 1, name: 'Pop! Marvel' },
  primaryImage: toPrimaryImage({
    id: 1,
    position: 0,
    sizeBytes: 350_000,
    createdAt: mockDate(0),
    ...createMockImageUrls('Spider-Man', 0),
  }),
  ...overrides,
});

export const createFunkoMockModel = (overrides?: Partial<FunkoApiModel>): FunkoApiModel => ({
  ...createFunkoSummaryMockModel(),
  collections: [{ id: 1, name: 'Owned' }],
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createFunkoMockModelList = (length: number, overrides?: Partial<FunkoApiModel>): FunkoApiModel[] =>
  Array.from({ length }, (_, index) =>
    createFunkoMockModel({
      id: index + 1,
      name: `Funko ${String(index + 1).padStart(2, '0')}`,
      number: String(index + 1),
      ...overrides,
    }),
  );
