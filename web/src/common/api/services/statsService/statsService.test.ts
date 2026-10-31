import statsService from './statsService';

// The user's own collections and the funkos in them: 20 of the mock seed's 30 funkos, two images each.
const OWN_FUNKO_COUNT = 20;
const OWN_IMAGE_COUNT = 40;
const CATEGORY_COUNT = 5;
const TAG_COUNT = 3;

it('returns the totals of the user’s collections in the mock store', async () => {
  const stats = await statsService.getStats();

  expect(stats).toMatchObject({
    funkoCount: OWN_FUNKO_COUNT,
    categoryCount: CATEGORY_COUNT,
    tagCount: TAG_COUNT,
    imageCount: OWN_IMAGE_COUNT,
  });
  expect(stats.collections.map((collection) => collection.name)).toEqual(['Owned', 'Wishlist']);
});
