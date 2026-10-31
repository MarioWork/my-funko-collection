import statsService from './statsService';

// The user's own collections and the funkos in them: 20 of the mock seed's 30 funkos, two images each.
it('returns the totals of the user’s collections in the mock store', async () => {
  const stats = await statsService.getStats();

  expect(stats).toMatchObject({ funkoCount: 20, categoryCount: 5, tagCount: 3, imageCount: 40 });
  expect(stats.collections.map((collection) => collection.name)).toEqual(['Owned', 'Wishlist']);
});
