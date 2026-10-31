import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import { createCategory, createFunko, type SignedInClient, signIn } from '../../testFixtures.ts';

const URL = '/categories';
const MISSING_ID = 999;
const INVALID_ID = 'abc';

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

describe('GET /categories', () => {
  it('lists categories by name with their funko count when no params are sent', async () => {
    const marvel = await createCategory('Pop! Marvel');
    await createCategory('Pop! Animation');
    await createFunko({ categoryId: marvel.id });
    await createFunko({ categoryId: marvel.id });

    const response = await api.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; funkoCount: number }[]; totalResultNumber: number }>();
    expect(body.data.map((category) => [category.name, category.funkoCount])).toEqual([
      ['Pop! Animation', 0],
      ['Pop! Marvel', 2],
    ]);
    expect(body.totalResultNumber).toBe(2);
  });

  it('keeps the matching categories when name is a fragment in another case', async () => {
    await createCategory('Pop! Marvel');
    await createCategory('Pop! Star Wars');

    const response = await api.inject({ method: 'GET', url: URL, query: { name: 'marvel' } });

    expect(response.json<{ data: { name: string }[] }>().data.map((category) => category.name)).toEqual([
      'Pop! Marvel',
    ]);
  });

  it('returns 400 with VALIDATION_ERROR when the page size is above the cap', async () => {
    const response = await api.inject({ method: 'GET', url: URL, query: { size: '101' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /categories/:categoryId', () => {
  it('returns the category when it exists', async () => {
    const created = await createCategory('Pop! Star Wars');

    const response = await api.inject({ method: 'GET', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'Pop! Star Wars', funkoCount: 0 });
  });

  it('returns the category when a member asks for it', async () => {
    // The catalogue is shared: members read it, only admins change it.
    const created = await createCategory('Pop! Star Wars');
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'GET', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(200);
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

describe('POST /categories', () => {
  it('creates the category with a trimmed name when the name has spaces around it', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: '  Pop! Games  ' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Pop! Games', funkoCount: 0 });
  });

  it('returns 400 when the name is empty', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/name' }] });
  });

  it('returns 409 when the name is taken', async () => {
    await createCategory('Pop! Games');

    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Pop! Games' } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
  });

  it('returns 403 ADMIN_ONLY and creates nothing when a member sends it', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'POST', url: URL, payload: { name: 'Pop! Games' } });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
    const list = await api.inject({ method: 'GET', url: URL });
    expect(list.json<{ totalResultNumber: number }>().totalResultNumber).toBe(0);
  });
});

describe('PATCH /categories/:categoryId', () => {
  it('renames the category when it exists', async () => {
    const created = await createCategory();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: 'Renamed' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'Renamed' });
  });

  it('returns 409 when the new name is taken', async () => {
    await createCategory('Pop! Marvel');
    const created = await createCategory();

    const response = await api.inject({
      method: 'PATCH',
      url: `${URL}/${created.id}`,
      payload: { name: 'Pop! Marvel' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the body carries an unknown key', async () => {
    const created = await createCategory();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { colour: 'red' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /categories/:categoryId', () => {
  it('removes the category with 204 when no funko uses it', async () => {
    const created = await createCategory();

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(204);
  });

  it('returns 409 when funkos still use it', async () => {
    const created = await createCategory();
    await createFunko({ categoryId: created.id });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
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
