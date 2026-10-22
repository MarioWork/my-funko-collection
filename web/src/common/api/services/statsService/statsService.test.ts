import statsService from './statsService';

describe('getStats', () => {
  it('returns the totals of the mock store', async () => {
    const stats = await statsService.getStats();

    expect(stats).toMatchObject({ funkoCount: 30, categoryCount: 5, tagCount: 3, imageCount: 60 });
    expect(stats.collections.map((collection) => collection.name)).toEqual(['Owned', 'Wishlist']);
  });
});
