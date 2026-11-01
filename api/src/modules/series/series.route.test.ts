import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import { createFunko, createSeries, type SignedInClient, signIn } from '../../testFixtures.ts';

const URL = '/series';
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

describe('GET /series', () => {
  it('lists series by name with their funko count when no params are sent', async () => {
    const strangerThings = await createSeries('Stranger Things');
    await createSeries('Daredevil: Born Again');
    await createFunko({ seriesId: strangerThings.id });
    await createFunko({ seriesId: strangerThings.id });
    await createFunko();

    const response = await api.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; funkoCount: number }[]; totalResultNumber: number }>();
    expect(body.data.map((oneSeries) => [oneSeries.name, oneSeries.funkoCount])).toEqual([
      ['Daredevil: Born Again', 0],
      ['Stranger Things', 2],
    ]);
    expect(body.totalResultNumber).toBe(2);
  });

  it('keeps the matching series when name is a fragment in another case', async () => {
    await createSeries('The Mandalorian');
    await createSeries('Stranger Things');

    const response = await api.inject({ method: 'GET', url: URL, query: { name: 'mandal' } });

    expect(response.json<{ data: { name: string }[] }>().data.map((oneSeries) => oneSeries.name)).toEqual([
      'The Mandalorian',
    ]);
  });

  it('returns 400 with VALIDATION_ERROR when the sort field is unknown', async () => {
    const response = await api.inject({ method: 'GET', url: URL, query: { sorting_fields: 'SERIES' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /series/:seriesId', () => {
  it('returns the series when it exists', async () => {
    const created = await createSeries('The Mandalorian');

    const response = await api.inject({ method: 'GET', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'The Mandalorian', funkoCount: 0 });
  });

  it('returns the series when a member asks for it', async () => {
    // The catalogue is shared: members read it, only admins change it.
    const created = await createSeries('The Mandalorian');
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

describe('POST /series', () => {
  it('creates the series with a trimmed name when the name has spaces around it', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: '  Daredevil: Born Again  ' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Daredevil: Born Again', funkoCount: 0 });
  });

  it('creates a waiting series only that member sees when a member sends it', async () => {
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'POST', url: URL, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Loki', status: 'WAITING' });
    const adminList = await api.inject({ method: 'GET', url: URL });
    expect(adminList.json<{ totalResultNumber: number }>().totalResultNumber).toBe(0);
  });

  it('returns 409 with the existing id when a member types a name the catalogue has', async () => {
    const existing = await createSeries('Loki');
    const member = await signIn(app, { role: 'MEMBER' });

    const response = await member.inject({ method: 'POST', url: URL, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT', existingId: existing.id });
  });

  it('returns 400 when the name is empty', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/name' }] });
  });

  it('returns 400 when the body has an unknown key', async () => {
    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Loki', year: 2021 } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 409 when the name is taken', async () => {
    await createSeries('Loki');

    const response = await api.inject({ method: 'POST', url: URL, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
  });
});

describe('PATCH /series/:seriesId', () => {
  it('renames the series when it exists', async () => {
    const created = await createSeries();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: 'Renamed' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'Renamed' });
  });

  it('returns 409 when the new name is taken', async () => {
    await createSeries('Loki');
    const created = await createSeries();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 400 when the name is empty', async () => {
    const created = await createSeries();

    const response = await api.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await api.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /series/:seriesId', () => {
  it('removes the series with 204 and leaves its funkos without a series when it exists', async () => {
    const created = await createSeries();
    const funko = await createFunko({ seriesId: created.id });

    const response = await api.inject({ method: 'DELETE', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(204);
    const funkoResponse = await api.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(funkoResponse.statusCode).toBe(200);
    expect(funkoResponse.json()).toMatchObject({ id: funko.id, series: null });
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
