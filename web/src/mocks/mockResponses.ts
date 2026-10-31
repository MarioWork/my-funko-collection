// Row → API model, the way the API's services do it; shared by every handler group.
import type {
  CategoryApiModel,
  CollectionApiModel,
  CollectionItemApiModel,
  FunkoApiModel,
  FunkoDetailApiModel,
  FunkoSummaryApiModel,
  NamedApiModel,
  SeriesApiModel,
  TagApiModel,
} from '@app-types/models';
import { HttpResponse } from 'msw/http';
import {
  BAD_REQUEST_STATUS,
  CONFLICT_STATUS,
  CREATED_STATUS,
  NO_CONTENT_STATUS,
  NOT_FOUND_STATUS,
} from '@utils/httpStatusUtils';
import { toPrimaryImage } from './mockImageUtils';
import { mockStore } from './mockStore';
import type {
  MockCategoryRow,
  MockSeriesRow,
  MockCollectionRow,
  MockFunkoRow,
  MockItemRow,
  MockNamedRow,
  MockTagRow,
} from './mockStore.type';

// Whatever HttpResponse.json accepts; msw/http does not export the type by name.
type MockJsonBody = Parameters<typeof HttpResponse.json>[0];

const NOT_FOUND_ERROR_CODE = 'NOT_FOUND';
const CONFLICT_ERROR_CODE = 'CONFLICT';
const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

// What the API answers when a unique name is taken.
export const DUPLICATE_CONFLICT_MESSAGE = 'A record with these values already exists';

export function toCategoryModel(row: MockCategoryRow): CategoryApiModel {
  return { ...row, funkoCount: mockStore.funkos.filter((funko) => funko.categoryId === row.id).length };
}

export function toSeriesModel(row: MockSeriesRow): SeriesApiModel {
  return { ...row, funkoCount: mockStore.funkos.filter((funko) => funko.seriesId === row.id).length };
}

export function toTagModel(row: MockTagRow): TagApiModel {
  return { ...row, itemCount: mockStore.items.filter((item) => item.tagIds.includes(row.id)).length };
}

export function toCollectionModel(row: MockCollectionRow): CollectionApiModel {
  const items = mockStore.items.filter((item) => item.collectionId === row.id);

  return {
    ...row,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalSpentCents: items.reduce((sum, item) => sum + (item.purchasePriceCents ?? 0) * item.quantity, 0),
  };
}

function toSeriesRef(seriesId: number | null): NamedApiModel | null {
  const series = mockStore.series.find((candidate) => candidate.id === seriesId);

  return series ? { id: series.id, name: series.name } : null;
}

function named(row: MockNamedRow | undefined): NamedApiModel {
  return row ? { id: row.id, name: row.name } : { id: 0, name: 'Unknown' };
}

export function toFunkoSummary(row: MockFunkoRow): FunkoSummaryApiModel {
  const primary = mockStore.images
    .filter((image) => image.funkoId === row.id)
    .sort((first, second) => first.position - second.position || first.id - second.id)[0];

  return {
    id: row.id,
    name: row.name,
    number: row.number,
    type: row.type,
    isChase: row.isChase,
    exclusive: row.exclusive,
    barcode: row.barcode,
    category: named(mockStore.categories.find((category) => category.id === row.categoryId)),
    series: toSeriesRef(row.seriesId),
    primaryImage: toPrimaryImage(primary),
  };
}

export function toFunkoModel(row: MockFunkoRow): FunkoApiModel {
  const collectionIds = new Set(
    mockStore.items.filter((item) => item.funkoId === row.id).map((item) => item.collectionId),
  );

  return {
    ...toFunkoSummary(row),
    collections: mockStore.collections.filter((collection) => collectionIds.has(collection.id)).map(named),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toFunkoDetail(row: MockFunkoRow): FunkoDetailApiModel {
  return {
    ...toFunkoModel(row),
    images: mockStore.images
      .filter((image) => image.funkoId === row.id)
      .sort((first, second) => first.position - second.position || first.id - second.id)
      .map(({ funkoId: _funkoId, ...image }) => image),
  };
}

export function toItemModel(row: MockItemRow): CollectionItemApiModel | undefined {
  const funko = mockStore.funkos.find((candidate) => candidate.id === row.funkoId);

  if (!funko) return undefined;

  return {
    id: row.id,
    collection: named(mockStore.collections.find((collection) => collection.id === row.collectionId)),
    funko: toFunkoSummary(funko),
    quantity: row.quantity,
    condition: row.condition,
    purchasePriceCents: row.purchasePriceCents,
    purchaseCurrency: row.purchaseCurrency,
    purchasedAt: row.purchasedAt,
    notes: row.notes,
    tags: mockStore.tags.filter((tag) => row.tagIds.includes(tag.id)).map(named),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// The API's error envelope.
export function errorResponse(status: number, code: string, message: string, existingId?: number): Response {
  return HttpResponse.json({ code, message, existingId }, { status });
}

export function created(body: MockJsonBody): Response {
  return HttpResponse.json(body, { status: CREATED_STATUS });
}

export function noContent(): Response {
  return new HttpResponse(null, { status: NO_CONTENT_STATUS });
}

export function notFound(entity: string, id: string | number): Response {
  return errorResponse(NOT_FOUND_STATUS, NOT_FOUND_ERROR_CODE, `${entity} ${id} not found`);
}

export function conflict(message: string, existingId?: number): Response {
  return errorResponse(CONFLICT_STATUS, CONFLICT_ERROR_CODE, message, existingId);
}

export function badRequest(message: string): Response {
  return errorResponse(BAD_REQUEST_STATUS, VALIDATION_ERROR_CODE, message);
}
