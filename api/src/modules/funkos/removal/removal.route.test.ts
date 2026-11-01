// Deleting a funko (issue #13): the plain cases.
import { buildApp, type App } from '../../../app.ts';
import { resetTestDb } from '../../../testDb.ts';
import { funkoFolderExists } from '../../../lib/imageStorage.ts';
import {
  createCategory,
  createCollection,
  createFunko,
  createItem,
  createTag,
  makeImage,
  type SignedInClient,
  signIn,
  toFormData,
} from '../../../testFixtures.ts';

const URL = '/funkos';
const MISSING_ID = 999;
// Typed and scanned as UPC-A (12 digits); stored and returned as EAN-13 (a leading zero).
const BARCODE = '889698624008';

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

async function seedCatalog() {
  const marvel = await createCategory('Pop! Marvel');
  const starWars = await createCategory('Pop! Star Wars');
  const spiderMan = await createFunko({ name: 'Spider-Man', number: '03', categoryId: marvel.id, barcode: BARCODE });
  const thanos = await createFunko({ name: 'Thanos', number: '78', categoryId: marvel.id });
  const thanosChase = await createFunko({ name: 'Thanos', number: '78', categoryId: marvel.id, isChase: true });
  const vader = await createFunko({
    name: 'Darth Vader',
    number: '01',
    categoryId: starWars.id,
    exclusive: 'SDCC 2024',
  });
  const owned = await createCollection({ name: 'Owned', isDefault: true });
  const wishlist = await createCollection({ name: 'Wishlist' });
  const box = await createTag('Box 3');
  await createItem(owned.id, spiderMan.id, { tagIds: [box.id] });
  await createItem(owned.id, vader.id);
  await createItem(wishlist.id, thanos.id);

  return { marvel, starWars, spiderMan, thanos, thanosChase, vader, owned, wishlist, box };
}

describe('DELETE /funkos/:funkoId', () => {
  it('returns 409 IN_COLLECTIONS naming the collections when the funko sits in one and force is not set', async () => {
    const { spiderMan } = await seedCatalog();

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}` });

    expect(response.statusCode).toBe(409);
    const body = response.json<{ code: string; message: string }>();
    expect(body.code).toBe('IN_COLLECTIONS');
    expect(body.message).toContain('"Owned"');
    expect((await api.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(200);
  });

  it('removes the funko from every collection and deletes it when force=true', async () => {
    const { spiderMan, thanos, owned, wishlist } = await seedCatalog();
    await createItem(wishlist.id, spiderMan.id);

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${spiderMan.id}`, query: { force: 'true' } });

    expect(response.statusCode).toBe(204);
    expect((await api.inject({ method: 'GET', url: `${URL}/${spiderMan.id}` })).statusCode).toBe(404);
    const ownedItems = await api.inject({ method: 'GET', url: `/collections/${owned.id}/items` });
    const wishlistItems = await api.inject({ method: 'GET', url: `/collections/${wishlist.id}/items` });
    expect(ownedItems.json<{ data: { funko: { name: string } }[] }>().data.map((item) => item.funko.name)).toEqual([
      'Darth Vader',
    ]);
    expect(wishlistItems.json<{ data: { funko: { id: number } }[] }>().data.map((item) => item.funko.id)).toEqual([
      thanos.id,
    ]);
    const tagsLeft = await api.inject({ method: 'GET', url: '/tags' });
    expect(tagsLeft.json<{ data: { name: string; itemCount: number }[] }>().data).toEqual([
      expect.objectContaining({ name: 'Box 3', itemCount: 0 }),
    ]);
  });

  it('returns 400 when force is not true or false', async () => {
    const { thanosChase } = await seedCatalog();

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}`, query: { force: 'yes' } });

    expect(response.statusCode).toBe(400);
  });

  it('removes the funko, its image rows and its folder when it is in no collection', async () => {
    const { thanosChase } = await seedCatalog();
    await api.inject({
      method: 'POST',
      url: `${URL}/${thanosChase.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${thanosChase.id}` });

    expect(response.statusCode).toBe(204);
    expect(await funkoFolderExists(thanosChase.id)).toBe(false);
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'DELETE', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
