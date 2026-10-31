import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createTag,
  createUser,
  defaultCollectionId,
  makeImage,
  toFormData,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

let app: App;
let api: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  api = await signIn(app);
});

describe('GET /stats', () => {
  it('totals the funkos, categories and images in the user’s collections and every collection of theirs', async () => {
    const marvel = await createCategory('Pop! Marvel');
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    const wishlist = await createCollection({ name: 'Wishlist' });
    await createTag();
    const funko = await createFunko({ categoryId: marvel.id });
    await createFunko({ categoryId: marvel.id });
    await createItem(owned.id, funko.id, { quantity: 2, purchasePriceCents: 1000 });

    const response = await api.inject({ method: 'GET', url: '/stats' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      funkoCount: 1,
      categoryCount: 1,
      tagCount: 1,
      imageCount: 0,
      imageBytes: 0,
      collections: [
        { id: owned.id, name: 'Owned', isDefault: true, itemCount: 1, totalQuantity: 2, totalSpentCents: 2000 },
        { id: wishlist.id, name: 'Wishlist', isDefault: false, itemCount: 0, totalQuantity: 0, totalSpentCents: 0 },
      ],
      byCategory: [{ id: marvel.id, name: 'Pop! Marvel', funkoCount: 1 }],
    });
  });

  it('leaves another user’s collections, and the funkos only they have, out of the totals', async () => {
    const other = await createUser();
    const marvel = await createCategory('Pop! Marvel');
    const starWars = await createCategory('Pop! Star Wars');
    const shared = await createFunko({ categoryId: marvel.id });
    const theirsOnly = await createFunko({ categoryId: starWars.id });
    await createItem(await defaultCollectionId(api.userId), shared.id);
    await createItem(await defaultCollectionId(other.id), shared.id, { quantity: 5, purchasePriceCents: 900 });
    await createItem(await defaultCollectionId(other.id), theirsOnly.id);
    await createCollection({ name: 'For sale', userId: other.id });
    const upload = await api.inject({
      method: 'POST',
      url: `/funkos/${theirsOnly.id}/images`,
      body: toFormData([{ buffer: await makeImage() }]),
    });
    expect(upload.statusCode).toBe(201);

    const response = await api.inject({ method: 'GET', url: '/stats' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      funkoCount: number;
      categoryCount: number;
      imageCount: number;
      collections: { name: string; itemCount: number; totalQuantity: number; totalSpentCents: number }[];
      byCategory: { name: string; funkoCount: number }[];
    }>();
    expect(body).toMatchObject({ funkoCount: 1, categoryCount: 1, imageCount: 0 });
    expect(body.collections).toEqual([
      expect.objectContaining({ name: 'Owned', itemCount: 1, totalQuantity: 1, totalSpentCents: 0 }),
      expect.objectContaining({ name: 'Wishlist', itemCount: 0 }),
    ]);
    expect(body.byCategory).toEqual([expect.objectContaining({ name: 'Pop! Marvel', funkoCount: 1 })]);
  });
});
