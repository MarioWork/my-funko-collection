// Row → API model, the way the API's services do it; shared by every handler group.
import type {
  CategoryApiModel,
  CollectionApiModel,
  CollectionItemApiModel,
  FunkoApiModel,
  FunkoDetailApiModel,
  FunkoSummaryApiModel,
  NamedApiModel,
  TagApiModel,
} from '@app-types/models';
import { HttpResponse } from 'msw/http';
import { toPrimaryImage } from './mockImageUtils';
import {
  mockStore,
  type MockCategoryRow,
  type MockCollectionRow,
  type MockFunkoRow,
  type MockItemRow,
  type MockTagRow,
} from './mockStore';

export function toCategoryModel(row: MockCategoryRow): CategoryApiModel {
  return { ...row, funkoCount: mockStore.funkos.filter((funko) => funko.categoryId === row.id).length };
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

function named(row: { id: number; name: string } | undefined): NamedApiModel {
  return row ? { id: row.id, name: row.name } : { id: 0, name: 'Unknown' };
}

export function toFunkoSummary(row: MockFunkoRow): FunkoSummaryApiModel {
  const primary = mockStore.images
    .filter((image) => image.funkoId === row.id)
    .sort((a, b) => a.position - b.position || a.id - b.id)[0];

  return {
    id: row.id,
    name: row.name,
    number: row.number,
    type: row.type,
    isChase: row.isChase,
    exclusive: row.exclusive,
    barcode: row.barcode,
    category: named(mockStore.categories.find((category) => category.id === row.categoryId)),
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
      .sort((a, b) => a.position - b.position || a.id - b.id)
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

export const notFound = (entity: string, id: string | number): Response =>
  errorResponse(404, 'NOT_FOUND', `${entity} ${id} not found`);
export const conflict = (message: string, existingId?: number): Response =>
  errorResponse(409, 'CONFLICT', message, existingId);
export const badRequest = (message: string): Response => errorResponse(400, 'VALIDATION_ERROR', message);
