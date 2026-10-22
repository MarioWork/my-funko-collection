import { http, HttpResponse } from 'msw/http';
import { ItemConditionUtil, SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import collectionItemService, { ItemApiSearchFields, ItemApiSortingFields } from './collectionItemService';

describe('getCollectionItems', () => {
  it('sends paging, sort and the item filters under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/collections/:collectionId/items`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await collectionItemService.getCollectionItems(1, {
      pagination: { page: '1', size: '20' },
      sortingField: ItemApiSortingFields.PURCHASE_PRICE,
      direction: SortingDirectionUtil.DESC,
      [ItemApiSearchFields.TAG_ID]: '1',
      [ItemApiSearchFields.CONDITION]: ItemConditionUtil.MINT_IN_BOX,
      [ItemApiSearchFields.PURCHASED_FROM]: '2024-01-01',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '1',
      size: '20',
      sorting_fields: 'PURCHASE_PRICE',
      direction: 'DESC',
      tagId: '1',
      condition: 'MINT_IN_BOX',
      purchasedFrom: '2024-01-01',
    });
  });

  it('lists the seeded owned items filtered by tag', async () => {
    const response = await collectionItemService.getCollectionItems(1, {
      pagination: { page: '1', size: '50' },
      [ItemApiSearchFields.TAG_ID]: '1',
    });

    expect(response.totalResultNumber).toBe(4);
    expect(response.data.map((item) => item.funko.name)).toEqual(
      expect.arrayContaining(['Iron Man', 'Deadpool', 'Darth Vader', 'Pikachu']),
    );
  });
});

describe('getItems', () => {
  it('lists across collections and narrows by collectionId', async () => {
    const all = await collectionItemService.getItems({ pagination: { page: '1', size: '50' } });
    const wishlist = await collectionItemService.getItems({
      pagination: { page: '1', size: '50' },
      [ItemApiSearchFields.COLLECTION_ID]: '2',
    });

    expect(all.totalResultNumber).toBe(20);
    expect(wishlist.totalResultNumber).toBe(5);
  });
});

describe('addCollectionItem', () => {
  it('creates the item with its tags and answers 409 with the existing id on a repeat', async () => {
    const created = await collectionItemService.addCollectionItem(2, {
      funkoId: 1,
      quantity: 1,
      condition: null,
      purchasePriceCents: null,
      purchaseCurrency: undefined,
      purchasedAt: null,
      notes: null,
      tagIds: [1],
    });
    const repeated = await collectionItemService.addCollectionItem(2, {
      funkoId: 1,
      quantity: 1,
      condition: null,
      purchasePriceCents: null,
      purchaseCurrency: undefined,
      purchasedAt: null,
      notes: null,
      tagIds: [],
    });

    expect(created.success).toBe(true);
    expect(created.data).toMatchObject({ collection: { name: 'Wishlist' }, tags: [{ name: 'Box 1' }] });
    expect(repeated).toMatchObject({ success: false, error: { statusCode: 409, existingId: created.data?.id } });
  });
});

describe('moveCollectionItem', () => {
  it('moves the item and keeps its tags', async () => {
    const result = await collectionItemService.moveCollectionItem(2, 16, { toCollectionId: 1 });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ collection: { id: 1, name: 'Owned' }, funko: { name: 'Vecna' } });
  });
});
