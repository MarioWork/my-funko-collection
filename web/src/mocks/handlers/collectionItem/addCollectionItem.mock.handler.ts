import { http } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { conflict, created, notFound, tagsNotFound, toItemModel } from '@mocks/mockResponses';
import { catalogueFunkos } from '@mocks/mockCatalogueUtils';
import { mockStore } from '@mocks/mockStore';
import type { MockItemRow } from '@mocks/mockStore.type';
import { nextId, nowIso } from '@mocks/mockStoreUtils';
import type { CreateCollectionItem } from '@services/collectionItemService/collectionItemService.type';
import { DEFAULT_CURRENCY } from '@utils/moneyUtils';

export default (baseUrl: string) => [
  http.post(`${baseUrl}/collections/:collectionId/items`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const collection = mockStore.collections.find((candidate) => String(candidate.id) === params.collectionId);

    if (!collection) return notFound('Collection', String(params.collectionId));

    const body = (await request.json()) as CreateCollectionItem;

    // A funko the user sees in the catalogue: approved, or one they sent in themselves.
    if (!catalogueFunkos().some((funko) => funko.id === body.funkoId)) return notFound('Funko', body.funkoId);

    const tagIds = [...new Set(body.tagIds ?? [])];

    const missingTags = tagsNotFound(tagIds);

    if (missingTags) return missingTags;

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

    return created(toItemModel(row));
  }),
];
