import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import { MOCK_DELAY } from '@mocks/handlers';
import { badRequest, conflict, notFound, toItemModel } from '@mocks/mockResponses';
import { mockStore, nowIso } from '@mocks/mockStore';
import type {
  MoveCollectionItem,
  UpdateCollectionItem,
} from '@services/collectionItemService/collectionItemService.type';

function findItem(
  collectionId: string | readonly string[] | undefined,
  itemId: string | readonly string[] | undefined,
) {
  return mockStore.items.find((item) => String(item.id) === itemId && String(item.collectionId) === collectionId);
}

export default (baseUrl: string) => [
  http.patch(`${baseUrl}/collections/:collectionId/items/:itemId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = findItem(params.collectionId, params.itemId);

    if (!row) return notFound('Collection item', String(params.itemId));

    const { tagIds, ...fields } = (await request.json()) as UpdateCollectionItem;

    if (tagIds?.some((tagId) => !mockStore.tags.some((tag) => tag.id === tagId)))
      return badRequest('One or more tagIds do not exist');

    Object.assign(row, fields, tagIds ? { tagIds: [...new Set(tagIds)] } : {}, { updatedAt: nowIso() });

    return HttpResponse.json(toItemModel(row));
  }),
  http.post(`${baseUrl}/collections/:collectionId/items/:itemId/move`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const row = findItem(params.collectionId, params.itemId);

    if (!row) return notFound('Collection item', String(params.itemId));

    const { toCollectionId } = (await request.json()) as MoveCollectionItem;

    if (toCollectionId === row.collectionId) return badRequest('The item is already in that collection');
    if (!mockStore.collections.some((collection) => collection.id === toCollectionId))
      return notFound('Collection', toCollectionId);

    const clash = mockStore.items.find((item) => item.collectionId === toCollectionId && item.funkoId === row.funkoId);

    if (clash) return conflict('This funko is already in the collection', clash.id);

    row.collectionId = toCollectionId;
    row.updatedAt = nowIso();

    return HttpResponse.json(toItemModel(row));
  }),
  http.delete(`${baseUrl}/collections/:collectionId/items/:itemId`, async ({ params }) => {
    await delay(MOCK_DELAY);

    const index = mockStore.items.findIndex(
      (item) => String(item.id) === params.itemId && String(item.collectionId) === params.collectionId,
    );

    if (index === -1) return notFound('Collection item', String(params.itemId));

    mockStore.items.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
