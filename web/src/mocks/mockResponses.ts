// Row → API model, the way the API's services do it; shared by every handler group.
import type {
  CategoryApiModel,
  CollectionApiModel,
  CollectionItemApiModel,
  FunkoApiModel,
  FunkoDetailApiModel,
  FunkoImageApiModel,
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
import { SubmissionStatusUtil } from '@app-types/utility';
import { catalogueFunkos, isMockAdmin, isSubmittedByMockUser, mockHolderIdsOf } from './mockCatalogueUtils';
import { toPrimaryImage } from './mockImageUtils';
import { mockStore } from './mockStore';
import type {
  MockCategoryRow,
  MockSeriesRow,
  MockCollectionRow,
  MockFunkoRow,
  MockImageRow,
  MockItemRow,
  MockNamedRow,
  MockTagRow,
} from './mockStore.type';

// Whatever HttpResponse.json accepts; msw/http does not export the type by name.
type MockJsonBody = Parameters<typeof HttpResponse.json>[0];

const NOT_FOUND_ERROR_CODE = 'NOT_FOUND';
const CONFLICT_ERROR_CODE = 'CONFLICT';
const IN_COLLECTIONS_ERROR_CODE = 'IN_COLLECTIONS';
const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

// What the API answers when a unique name is taken.
export const DUPLICATE_CONFLICT_MESSAGE = 'A record with these values already exists';

// The counts take only the funkos the signed-in user sees, as the API's do.
export function toCategoryModel({ submittedById: _submittedById, ...row }: MockCategoryRow): CategoryApiModel {
  return { ...row, funkoCount: catalogueFunkos().filter((funko) => funko.categoryId === row.id).length };
}

export function toSeriesModel({ submittedById: _submittedById, ...row }: MockSeriesRow): SeriesApiModel {
  return { ...row, funkoCount: catalogueFunkos().filter((funko) => funko.seriesId === row.id).length };
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
    status: row.status,
    isSubmittedByMe: isSubmittedByMockUser(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// An image row as the funko endpoints answer it: without the columns only the store keeps.
export function toFunkoImageModel({
  funkoId: _funkoId,
  uploadedById: _uploadedById,
  ...image
}: MockImageRow): FunkoImageApiModel {
  return image;
}

// Who sent a submission in, for an admin: the signed-in user, another user, or null once deleted (a removed user).
export function senderOf(row: MockFunkoRow): NamedApiModel | null {
  if (row.submittedById === mockStore.auth.userId) return { id: mockStore.auth.userId, name: mockStore.auth.userName };

  const sender = mockStore.users.find((user) => user.id === row.submittedById);

  return sender ? { id: sender.id, name: sender.name } : null;
}

// The catalogue funko a merged submission went into, by id and name; null when it was not merged (or that funko is
// gone).
export function mergedIntoOf(row: MockFunkoRow): NamedApiModel | null {
  const target = mockStore.funkos.find((funko) => funko.id === row.mergedIntoId);

  return target ? { id: target.id, name: target.name } : null;
}

type ReviewDetails = Pick<FunkoDetailApiModel, 'rejectionReason' | 'changedByAdminAt' | 'mergedInto'>;

// How a submission's review went, for an admin and its sender only, as the API answers it.
function reviewDetailsOf(row: MockFunkoRow): ReviewDetails {
  const canKnow = isMockAdmin() || isSubmittedByMockUser(row);

  if (!canKnow) return {};

  return {
    rejectionReason: row.rejectionReason,
    changedByAdminAt: row.changedByAdminAt,
    mergedInto: mergedIntoOf(row),
  };
}

export function toFunkoDetail(row: MockFunkoRow): FunkoDetailApiModel {
  const isSubmissionForAdmin = isMockAdmin() && row.status !== SubmissionStatusUtil.APPROVED;

  return {
    ...toFunkoModel(row),
    ...reviewDetailsOf(row),
    submittedBy: isSubmissionForAdmin ? senderOf(row) : undefined,
    userCount: isMockAdmin() ? mockHolderIdsOf(row.id).length : undefined,
    images: mockStore.images
      .filter((image) => image.funkoId === row.id)
      .sort((first, second) => first.position - second.position || first.id - second.id)
      .map(toFunkoImageModel),
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

// The 404 the API answers when an item write names a tag that is not one of the user's own (the store holds only
// theirs); undefined when every id is one of them.
export function tagsNotFound(tagIds: number[]): Response | undefined {
  const missingIds = [...new Set(tagIds)].filter((tagId) => !mockStore.tags.some((tag) => tag.id === tagId));

  if (missingIds.length === 0) return undefined;

  return notFound('Tag', missingIds.join(', '));
}

export function conflict(message: string, existingId?: number): Response {
  return errorResponse(CONFLICT_STATUS, CONFLICT_ERROR_CODE, message, existingId);
}

// The 409 for a funko still in collections: how many users have it, never who.
export function inCollections(message: string, userCount: number): Response {
  return HttpResponse.json({ code: IN_COLLECTIONS_ERROR_CODE, message, userCount }, { status: CONFLICT_STATUS });
}

export function badRequest(message: string): Response {
  return errorResponse(BAD_REQUEST_STATUS, VALIDATION_ERROR_CODE, message);
}
