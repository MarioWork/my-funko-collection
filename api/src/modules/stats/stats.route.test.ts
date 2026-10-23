import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createTag,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

let app: App;
let api: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  api = await signIn(app);
});

describe('GET /stats', () => {
  it('totals funkos, categories, tags, images and every collection when the catalog has data', async () => {
    const marvel = await createCategory('Pop! Marvel');
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    await createTag();
    const funko = await createFunko({ categoryId: marvel.id });
    await createFunko({ categoryId: marvel.id });
    await createItem(owned.id, funko.id, { quantity: 2, purchasePriceCents: 1000 });

    const response = await api.inject({ method: 'GET', url: '/stats' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      funkoCount: 2,
      categoryCount: 1,
      tagCount: 1,
      imageCount: 0,
      imageBytes: 0,
      collections: [
        { id: owned.id, name: 'Owned', isDefault: true, itemCount: 1, totalQuantity: 2, totalSpentCents: 2000 },
      ],
      byCategory: [{ id: marvel.id, name: 'Pop! Marvel', funkoCount: 2 }],
    });
  });
});
