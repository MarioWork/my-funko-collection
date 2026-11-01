import type { CategoryApiModel } from '@app-types/models';

// The two fields that point at a category or a series; both are required.
export type ReferenceFieldName = 'categoryId' | 'seriesId';

// A category or series as the dropdown lists it (a series has the same shape).
export type ReferenceRow = Pick<CategoryApiModel, 'id' | 'name' | 'status'>;
