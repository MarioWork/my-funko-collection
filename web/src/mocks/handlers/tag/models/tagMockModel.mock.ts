import type { TagApiModel } from '@app-types/models';
import { mockDate } from '@mocks/mockStore';

export const createTagMockModel = (overrides?: Partial<TagApiModel>): TagApiModel => ({
  id: 1,
  name: 'Box 1',
  notes: null,
  itemCount: 4,
  createdAt: mockDate(0),
  updatedAt: mockDate(0),
  ...overrides,
});

export const createTagMockModelList = (length: number, overrides?: Partial<TagApiModel>): TagApiModel[] =>
  Array.from({ length }, (_, index) => createTagMockModel({ id: index + 1, name: `Box ${index + 1}`, ...overrides }));
