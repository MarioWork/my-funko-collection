import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { createCollection, createFunko, createItem } from '../../testFixtures.ts';

const URL = '/collections';
const MISSING_ID = 999;

type CollectionBody = {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
};

let app: App;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
});

describe('GET /collections', () => {
  it('lists collections with item count, total quantity and money spent', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    await createCollection({ name: 'Wishlist' });
    await createItem(owned.id, (await createFunko()).id, { quantity: 2, purchasePriceCents: 1000 });
    await createItem(owned.id, (await createFunko()).id, { purchasePriceCents: 1550 });

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: CollectionBody[] }>();
    expect(
      body.data.map(({ name, isDefault, itemCount, totalQuantity, totalSpentCents }) => [
        name,
        isDefault,
        itemCount,
        totalQuantity,
        totalSpentCents,
      ]),
    ).toEqual([
      ['Owned', true, 2, 3, 3550],
      ['Wishlist', false, 0, 0, 0],
    ]);
  });
});

describe('POST /collections', () => {
  it('creates a collection and moves the default flag when asked', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Display', isDefault: true } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Display', isDefault: true, itemCount: 0 });
    const previous = await app.inject({ method: 'GET', url: `${URL}/${owned.id}` });
    expect(previous.json()).toMatchObject({ isDefault: false });
  });

  it('returns 409 when the name is taken', async () => {
    await createCollection({ name: 'Owned' });

    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Owned' } });

    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /collections/:collectionId', () => {
  it('moves the default to this collection', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    const wishlist = await createCollection({ name: 'Wishlist' });

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${wishlist.id}`, payload: { isDefault: true } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ isDefault: true });
    const previous = await app.inject({ method: 'GET', url: `${URL}/${owned.id}` });
    expect(previous.json()).toMatchObject({ isDefault: false });
  });

  it('returns 409 when trying to unset the default directly', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${owned.id}`, payload: { isDefault: false } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /collections/:collectionId', () => {
  it('removes a non-default collection and its items, keeping the funkos', async () => {
    const wishlist = await createCollection({ name: 'Wishlist' });
    const funko = await createFunko();
    await createItem(wishlist.id, funko.id);

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${wishlist.id}` });

    expect(response.statusCode).toBe(204);
    const funkoResponse = await app.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(funkoResponse.statusCode).toBe(200);
    expect(funkoResponse.json()).toMatchObject({ collections: [] });
  });

  it('returns 409 for the default collection', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${owned.id}` });

    expect(response.statusCode).toBe(409);
  });
});
