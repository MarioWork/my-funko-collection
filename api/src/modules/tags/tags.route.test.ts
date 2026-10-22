import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { createCollection, createFunko, createItem, createTag } from '../../testFixtures.ts';

const URL = '/tags';
const MISSING_ID = 999;

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

describe('GET /tags', () => {
  it('lists tags with how many items carry them', async () => {
    const box = await createTag('Box 1');
    await createTag('Shelf');
    const collection = await createCollection();
    await createItem(collection.id, (await createFunko()).id, { tagIds: [box.id] });
    await createItem(collection.id, (await createFunko()).id, { tagIds: [box.id] });

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; itemCount: number }[] }>();
    expect(body.data.map((tag) => [tag.name, tag.itemCount])).toEqual([
      ['Box 1', 2],
      ['Shelf', 0],
    ]);
  });
});

describe('POST /tags', () => {
  it('creates the tag with optional notes', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Box 3', notes: 'Attic' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Box 3', notes: 'Attic', itemCount: 0 });
  });

  it('returns 400 when the body carries an unknown key', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Box 3', colour: 'red' } });

    expect(response.statusCode).toBe(400);
  });

  it('returns 409 when the name is taken', async () => {
    await createTag('Box 3');

    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Box 3' } });

    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /tags/:tagId', () => {
  it('updates the notes and keeps the name', async () => {
    const tag = await createTag('Box 3');

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${tag.id}`, payload: { notes: 'Garage' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Box 3', notes: 'Garage' });
  });
});

describe('DELETE /tags/:tagId', () => {
  it('removes the tag from its items and answers 204', async () => {
    const tag = await createTag();
    const collection = await createCollection();
    const funko = await createFunko();
    const item = await createItem(collection.id, funko.id, { tagIds: [tag.id] });

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${tag.id}` });

    expect(response.statusCode).toBe(204);
    const itemResponse = await app.inject({ method: 'GET', url: `/collections/${collection.id}/items/${item.id}` });
    expect(itemResponse.json()).toMatchObject({ tags: [] });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'DELETE', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
