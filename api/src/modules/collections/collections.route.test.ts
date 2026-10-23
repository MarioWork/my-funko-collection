import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { createCollection, createFunko, createItem, type SignedInClient, signIn } from '../../testFixtures.ts';

const URL = '/collections';
const MISSING_ID = 999;
const INVALID_ID = 'abc';

type CollectionBody = {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  totalQuantity: number;
  totalSpentCents: number;
};

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

describe('GET /collections', () => {
  it('lists collections with item count, total quantity and money spent when no params are sent', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    await createCollection({ name: 'Wishlist' });
    await createItem(owned.id, (await createFunko()).id, { quantity: 2, purchasePriceCents: 1000 });
    await createItem(owned.id, (await createFunko()).id, { purchasePriceCents: 1550 });

    const response = await api.inject({ method: 'GET', url: URL });

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

  it('returns 400 with VALIDATION_ERROR when the page is not a positive integer', async () => {
    const response = await api.inject({ method: 'GET', url: URL, query: { page: '0' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /collections/:collectionId', () => {
  it('returns the collection with its totals when it exists', async () => {
    const wishlist = await createCollection({ name: 'Wishlist' });

    const response = await api.inject({ method: 'GET', url: `${URL}/${wishlist.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: wishlist.id, name: 'Wishlist', isDefault: false, itemCount: 0 });
  });

  it('returns 400 when the id is not a positive integer', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/${INVALID_ID}` });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'GET', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('POST /collections', () => {
  it('creates the collection and moves the default flag to it when isDefault is true', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Display', isDefault: true } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Display', isDefault: true, itemCount: 0 });
    const previous = await api.inject({ method: 'GET', url: `${URL}/${owned.id}` });
    expect(previous.json()).toMatchObject({ isDefault: false });
  });

  it('returns 400 when the name is empty', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/name' }] });
  });

  it('returns 409 when the name is taken', async () => {
    await createCollection({ name: 'Owned' });

    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Owned' } });

    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /collections/:collectionId', () => {
  it('moves the default to this collection when isDefault is true', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });
    const wishlist = await createCollection({ name: 'Wishlist' });

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${wishlist.id}`, payload: { isDefault: true } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ isDefault: true });
    const previous = await api.inject({ method: 'GET', url: `${URL}/${owned.id}` });
    expect(previous.json()).toMatchObject({ isDefault: false });
  });

  it('returns 409 when the new name is taken', async () => {
    await createCollection({ name: 'Owned' });
    const wishlist = await createCollection({ name: 'Wishlist' });

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${wishlist.id}`, payload: { name: 'Owned' } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 409 when the body unsets the default directly', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${owned.id}`, payload: { isDefault: false } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the body carries an unknown key', async () => {
    const wishlist = await createCollection({ name: 'Wishlist' });

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${wishlist.id}`, payload: { colour: 'red' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /collections/:collectionId', () => {
  it('removes the collection and its items and keeps the funkos when it is not the default', async () => {
    const wishlist = await createCollection({ name: 'Wishlist' });
    const funko = await createFunko();
    await createItem(wishlist.id, funko.id);

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${wishlist.id}` });

    expect(response.statusCode).toBe(204);
    const funkoResponse = await api.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(funkoResponse.statusCode).toBe(200);
    expect(funkoResponse.json()).toMatchObject({ collections: [] });
  });

  it('returns 409 when it is the default collection', async () => {
    const owned = await createCollection({ name: 'Owned', isDefault: true });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${owned.id}` });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the id is not a positive integer', async () => {
    const response = await api.inject({ method: 'DELETE', url: `${URL}/${INVALID_ID}` });

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'DELETE', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
