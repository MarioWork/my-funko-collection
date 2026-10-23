import type { SeriesApiModel } from '@app-types/models';
import { mockDate } from '@mocks/mockStore';

export const createSeriesMockModel = (overrides?: Partial<SeriesApiModel>): SeriesApiModel => ({
  id: 1,
  name: 'Stranger Things',
  funkoCount: 4,
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createSeriesMockModelList = (length: number, overrides?: Partial<SeriesApiModel>): SeriesApiModel[] =>
  Array.from({ length }, (_, index) =>
    createSeriesMockModel({ id: index + 1, name: `Series ${index + 1}`, ...overrides }),
  );
