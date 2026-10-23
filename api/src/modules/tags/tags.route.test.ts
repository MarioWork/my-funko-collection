import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import {
  createCollection,
  createFunko,
  createItem,
  createTag,
  type SignedInClient,
  signIn,
} from '../../testFixtures.ts';

const URL = '/tags';
const MISSING_ID = 999;
const INVALID_ID = 'abc';

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

describe('GET /tags', () => {
  it('lists tags with how many items carry them when no params are sent', async () => {
    const box = await createTag('Box 1');
    await createTag('Shelf');
    const collection = await createCollection();
    await createItem(collection.id, (await createFunko()).id, { tagIds: [box.id] });
    await createItem(collection.id, (await createFunko()).id, { tagIds: [box.id] });

    const response = await api.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; itemCount: number }[] }>();
    expect(body.data.map((tag) => [tag.name, tag.itemCount])).toEqual([
      ['Box 1', 2],
      ['Shelf', 0],
    ]);
  });

  it('returns 400 with VALIDATION_ERROR when the direction is unknown', async () => {
    const response = await api.inject({ method: 'GET', url: URL, query: { direction: 'UP' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /tags/:tagId', () => {
  it('returns the tag with its item count when it exists', async () => {
    const tag = await createTag('Box 3');

    const response = await api.inject({ method: 'GET', url: `${URL}/${tag.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: tag.id, name: 'Box 3', itemCount: 0 });
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

describe('POST /tags', () => {
  it('creates the tag with its notes when notes are sent', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Box 3', notes: 'Attic' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Box 3', notes: 'Attic', itemCount: 0 });
  });

  it('returns 400 when the body carries an unknown key', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Box 3', colour: 'red' } });

    expect(response.statusCode).toBe(400);
  });

  it('returns 409 when the name is taken', async () => {
    await createTag('Box 3');

    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Box 3' } });

    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /tags/:tagId', () => {
  it('updates the notes and keeps the name when only notes are sent', async () => {
    const tag = await createTag('Box 3');

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${tag.id}`, payload: { notes: 'Garage' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Box 3', notes: 'Garage' });
  });

  it('returns 400 when the name is empty', async () => {
    const tag = await createTag();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${tag.id}`, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { notes: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /tags/:tagId', () => {
  it('removes the tag from its items and answers 204 when it exists', async () => {
    const tag = await createTag();
    const collection = await createCollection();
    const funko = await createFunko();
    const item = await createItem(collection.id, funko.id, { tagIds: [tag.id] });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${tag.id}` });

    expect(response.statusCode).toBe(204);
    const itemResponse = await api.inject({ method: 'GET', url: `/collections/${collection.id}/items/${item.id}` });
    expect(itemResponse.json()).toMatchObject({ tags: [] });
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
