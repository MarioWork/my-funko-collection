import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import collectionService, { CollectionApiSearchFields, CollectionApiSortingFields } from './collectionService';

const OWNED_COLLECTION_ID = 1;
const WISHLIST_COLLECTION_ID = 2;

describe('getCollections', () => {
  it('sends the page, sort and name filter under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/collections`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await collectionService.getCollections({
      pagination: { page: '2', size: '20' },
      sortingField: CollectionApiSortingFields.CREATION_DATE,
      direction: SortingDirectionUtil.DESC,
      [CollectionApiSearchFields.NAME]: 'wish',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '2',
      size: '20',
      sorting_fields: 'CREATION_DATE',
      direction: 'DESC',
      name: 'wish',
    });
  });

  it('returns the seeded collections with item counts and money spent', async () => {
    const response = await collectionService.getCollections({ pagination: { page: '1', size: '10' } });

    expect(
      response.data.map(({ name, isDefault, itemCount, totalQuantity, totalSpentCents }) => [
        name,
        isDefault,
        itemCount,
        totalQuantity,
        totalSpentCents,
      ]),
    ).toEqual([
      ['Owned', true, 15, 16, 25384],
      ['Wishlist', false, 5, 5, 0],
    ]);
  });
});

describe('addCollection', () => {
  it('returns the new, empty collection', async () => {
    const result = await collectionService.addCollection({ name: 'Trades', notes: 'To swap', isDefault: false });

    expect(result).toMatchObject({
      success: true,
      data: { name: 'Trades', notes: 'To swap', isDefault: false, itemCount: 0 },
    });
  });

  it('returns the 409 envelope for a taken name', async () => {
    const result = await collectionService.addCollection({ name: 'Wishlist', notes: null, isDefault: false });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});

describe('updateCollection', () => {
  it('moves the default flag to the updated collection', async () => {
    const result = await collectionService.updateCollection(WISHLIST_COLLECTION_ID, { isDefault: true });
    const previous = await collectionService.getCollection(OWNED_COLLECTION_ID);

    expect(result.data).toMatchObject({ name: 'Wishlist', isDefault: true });
    expect(previous.isDefault).toBe(false);
  });

  it('returns the 409 envelope when unsetting the default', async () => {
    const result = await collectionService.updateCollection(OWNED_COLLECTION_ID, { isDefault: false });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});

describe('deleteCollection', () => {
  it('deletes a collection that is not the default', async () => {
    const result = await collectionService.deleteCollection(WISHLIST_COLLECTION_ID);
    const remaining = await collectionService.getCollections({ pagination: { page: '1', size: '10' } });

    expect(result.success).toBe(true);
    expect(remaining.data.map((collection) => collection.name)).toEqual(['Owned']);
  });

  it('returns the 409 envelope for the default collection', async () => {
    const result = await collectionService.deleteCollection(OWNED_COLLECTION_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});
