import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, conflict, notFound, toItemModel } from '@mocks/mockResponses';
import { DEFAULT_CURRENCY, mockStore, nextId, nowIso, type MockItemRow } from '@mocks/mockStore';
import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/collections/:collectionId/items`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const collection = mockStore.collections.find((candidate) => String(candidate.id) === params.collectionId);

    if (!collection) return notFound('Collection', String(params.collectionId));

    const body = (await request.json()) as CreateCollectionItem;

    if (!mockStore.funkos.some((funko) => funko.id === body.funkoId)) return notFound('Funko', body.funkoId);

    const tagIds = [...new Set(body.tagIds ?? [])];

    if (tagIds.some((tagId) => !mockStore.tags.some((tag) => tag.id === tagId)))
      return badRequest('One or more tagIds do not exist');

    const existing = mockStore.items.find(
      (item) => item.collectionId === collection.id && item.funkoId === body.funkoId,
    );

    if (existing) return conflict('This funko is already in the collection', existing.id);

    const row: MockItemRow = {
      id: nextId(mockStore.items),
      collectionId: collection.id,
      funkoId: body.funkoId,
      quantity: body.quantity,
      condition: body.condition ?? null,
      purchasePriceCents: body.purchasePriceCents ?? null,
      purchaseCurrency: body.purchaseCurrency ?? DEFAULT_CURRENCY,
      purchasedAt: body.purchasedAt ?? null,
      notes: body.notes ?? null,
      tagIds,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    mockStore.items.push(row);

    return HttpResponse.json(toItemModel(row), { status: 201 });
  }),
];
