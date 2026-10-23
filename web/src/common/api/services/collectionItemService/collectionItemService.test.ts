import { http, HttpResponse } from 'msw/http';
import { ItemConditionUtil, SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import collectionItemService, { ItemApiSearchFields, ItemApiSortingFields } from './collectionItemService';

const OWNED_COLLECTION_ID = 1;
const WISHLIST_COLLECTION_ID = 2;
// Seed items: the first (Spider-Man) sits in Owned, the sixteenth (Vecna) in Wishlist.
const SPIDER_MAN_ITEM_ID = 1;
const VECNA_ITEM_ID = 16;

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

describe('updateCollectionItem', () => {
  it('returns the item with the changed fields', async () => {
    const result = await collectionItemService.updateCollectionItem(OWNED_COLLECTION_ID, SPIDER_MAN_ITEM_ID, {
      quantity: 3,
      notes: 'Signed',
    });

    expect(result).toMatchObject({ success: true, data: { id: SPIDER_MAN_ITEM_ID, quantity: 3, notes: 'Signed' } });
  });

  it('returns the 404 envelope for an item outside the collection', async () => {
    const result = await collectionItemService.updateCollectionItem(WISHLIST_COLLECTION_ID, SPIDER_MAN_ITEM_ID, {
      quantity: 3,
    });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('moveCollectionItem', () => {
  it('moves the item and keeps its tags', async () => {
    const result = await collectionItemService.moveCollectionItem(WISHLIST_COLLECTION_ID, VECNA_ITEM_ID, {
      toCollectionId: OWNED_COLLECTION_ID,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ collection: { id: 1, name: 'Owned' }, funko: { name: 'Vecna' } });
  });

  it('returns the 400 envelope when the item is already in that collection', async () => {
    const result = await collectionItemService.moveCollectionItem(WISHLIST_COLLECTION_ID, VECNA_ITEM_ID, {
      toCollectionId: WISHLIST_COLLECTION_ID,
    });

    expect(result).toMatchObject({ success: false, error: { statusCode: 400 } });
  });
});

describe('deleteCollectionItem', () => {
  it('deletes the item from its collection', async () => {
    const result = await collectionItemService.deleteCollectionItem(OWNED_COLLECTION_ID, SPIDER_MAN_ITEM_ID);
    const remaining = await collectionItemService.getCollectionItems(OWNED_COLLECTION_ID, {
      pagination: { page: '1', size: '50' },
    });

    expect(result.success).toBe(true);
    expect(remaining.data.map((item) => item.id)).not.toContain(SPIDER_MAN_ITEM_ID);
  });

  it('returns the 404 envelope for an item outside the collection', async () => {
    const result = await collectionItemService.deleteCollectionItem(WISHLIST_COLLECTION_ID, SPIDER_MAN_ITEM_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});
