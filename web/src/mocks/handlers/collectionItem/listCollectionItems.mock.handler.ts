import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { CollectionItemApiModel } from '@app-types/models';
import type { ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { idList, paginateMockList } from '@mocks/mockListUtils';
import { notFound, toItemModel } from '@mocks/mockResponses';
import { mockStore, type MockItemRow } from '@mocks/mockStore';
import { ItemApiSearchFields, ItemApiSortingFields } from '@services/collectionItemService/collectionItemService';

function listItems(request: Request, rows: MockItemRow[]): ResponseWithPaginationUtil<CollectionItemApiModel> {
  const params = new URL(request.url).searchParams;
  const tagIds = idList(params.get(ItemApiSearchFields.TAG_ID));
  const collectionIds = idList(params.get(ItemApiSearchFields.COLLECTION_ID));
  const categoryIds = idList(params.get(ItemApiSearchFields.CATEGORY_ID));
  const funkoIds = idList(params.get(ItemApiSearchFields.FUNKO_ID));

  const narrowed = rows
    .filter((row) => !tagIds || tagIds.some((tagId) => row.tagIds.includes(tagId)))
    .filter((row) => !collectionIds || collectionIds.includes(row.collectionId))
    .filter((row) => !funkoIds || funkoIds.includes(row.funkoId))
    .map(toItemModel)
    .filter((item): item is CollectionItemApiModel => item !== undefined)
    .filter((item) => !categoryIds || categoryIds.includes(item.funko.category.id));

  return paginateMockList(request, narrowed, {
    filters: {
      [ItemApiSearchFields.NAME]: (item) => item.funko.name,
      [ItemApiSearchFields.CONDITION]: (item) => item.condition ?? '',
    },
    ranges: [
      {
        from: ItemApiSearchFields.PURCHASED_FROM,
        to: ItemApiSearchFields.PURCHASED_TO,
        read: (item) => item.purchasedAt ?? '',
      },
    ],
    sorts: {
      [ItemApiSortingFields.NAME]: (item) => item.funko.name,
      [ItemApiSortingFields.NUMBER]: (item) => Number.parseInt(item.funko.number, 10) || 0,
      [ItemApiSortingFields.CREATION_DATE]: (item) => item.createdAt,
      [ItemApiSortingFields.UPDATE_DATE]: (item) => item.updatedAt,
      [ItemApiSortingFields.PURCHASE_DATE]: (item) => item.purchasedAt ?? '',
      [ItemApiSortingFields.PURCHASE_PRICE]: (item) => item.purchasePriceCents ?? -1,
    },
  });
}

export default (baseUrl: string) => [
  http.get(`${baseUrl}/collections/:collectionId/items`, async ({ params, request }) => {
    await delay(MOCK_DELAY);

    const collection = mockStore.collections.find((candidate) => String(candidate.id) === params.collectionId);

    if (!collection) return notFound('Collection', String(params.collectionId));

    return HttpResponse.json(
      listItems(
        request,
        mockStore.items.filter((item) => item.collectionId === collection.id),
      ),
    );
  }),
  http.get(`${baseUrl}/items`, async ({ request }) => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(listItems(request, mockStore.items));
  }),
];
