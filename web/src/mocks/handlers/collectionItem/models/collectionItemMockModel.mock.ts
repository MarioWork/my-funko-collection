import type { CollectionItemApiModel } from '@app-types/models';
import { ItemConditionUtil } from '@app-types/utility';
import { createFunkoSummaryMockModel } from '@mocks/handlers/funko/models/funkoMockModel.mock';
import { mockDate } from '@mocks/mockStore';

export const createCollectionItemMockModel = (overrides?: Partial<CollectionItemApiModel>): CollectionItemApiModel => ({
  id: 1,
  collection: { id: 1, name: 'Owned' },
  funko: createFunkoSummaryMockModel(),
  quantity: 1,
  condition: ItemConditionUtil.MINT_IN_BOX,
  purchasePriceCents: 1499,
  purchaseCurrency: 'EUR',
  purchasedAt: '2024-03-02',
  notes: null,
  tags: [{ id: 3, name: 'Display shelf' }],
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createCollectionItemMockModelList = (
  length: number,
  overrides?: Partial<CollectionItemApiModel>,
): CollectionItemApiModel[] =>
  Array.from({ length }, (_, index) =>
    createCollectionItemMockModel({
      id: index + 1,
      funko: createFunkoSummaryMockModel({ id: index + 1, name: `Funko ${index + 1}` }),
      ...overrides,
    }),
  );
