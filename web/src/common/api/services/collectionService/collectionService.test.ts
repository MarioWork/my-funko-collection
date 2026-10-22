import collectionService from './collectionService';

describe('getCollections', () => {
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

describe('updateCollection', () => {
  it('moves the default flag to the updated collection', async () => {
    const result = await collectionService.updateCollection(2, { isDefault: true });
    const previous = await collectionService.getCollection(1);

    expect(result.data).toMatchObject({ name: 'Wishlist', isDefault: true });
    expect(previous.isDefault).toBe(false);
  });
});

describe('deleteCollection', () => {
  it('returns the 409 envelope for the default collection', async () => {
    const result = await collectionService.deleteCollection(1);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});
