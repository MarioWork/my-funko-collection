import { buildApp, type App } from '../../app.ts';
import { prepareTestDb, resetTestDb } from '../../db/testDb.ts';
import { createFunko, createSeries } from '../../testFixtures.ts';

const URL = '/series';
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

describe('GET /series', () => {
  it('lists series by name with their funko count when no params are sent', async () => {
    const strangerThings = await createSeries('Stranger Things');
    await createSeries('Daredevil: Born Again');
    await createFunko({ seriesId: strangerThings.id });
    await createFunko({ seriesId: strangerThings.id });
    await createFunko();

    const response = await app.inject({ method: 'GET', url: URL });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; funkoCount: number }[]; totalResultNumber: number }>();
    expect(body.data.map((oneSeries) => [oneSeries.name, oneSeries.funkoCount])).toEqual([
      ['Daredevil: Born Again', 0],
      ['Stranger Things', 2],
    ]);
    expect(body.totalResultNumber).toBe(2);
  });

  it('filters by a name fragment case-insensitively', async () => {
    await createSeries('The Mandalorian');
    await createSeries('Stranger Things');

    const response = await app.inject({ method: 'GET', url: URL, query: { name: 'mandal' } });

    expect(response.json<{ data: { name: string }[] }>().data.map((oneSeries) => oneSeries.name)).toEqual([
      'The Mandalorian',
    ]);
  });

  it('rejects an unknown sort field with VALIDATION_ERROR', async () => {
    const response = await app.inject({ method: 'GET', url: URL, query: { sorting_fields: 'SERIES' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});

describe('GET /series/:seriesId', () => {
  it('returns the series when it exists', async () => {
    const created = await createSeries('The Mandalorian');

    const response = await app.inject({ method: 'GET', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'The Mandalorian', funkoCount: 0 });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'GET', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('POST /series', () => {
  it('creates the series and trims the name', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { name: '  Daredevil: Born Again  ' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Daredevil: Born Again', funkoCount: 0 });
  });

  it('returns 400 when the name is empty', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { name: ' ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR', issues: [{ path: '/name' }] });
  });

  it('returns 400 when the body has an unknown key', async () => {
    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Loki', year: 2021 } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 409 when the name is taken', async () => {
    await createSeries('Loki');

    const response = await app.inject({ method: 'POST', url: URL, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT' });
  });
});

describe('PATCH /series/:seriesId', () => {
  it('renames the series when it exists', async () => {
    const created = await createSeries();

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: 'Renamed' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: created.id, name: 'Renamed' });
  });

  it('returns 409 when the new name is taken', async () => {
    await createSeries('Loki');
    const created = await createSeries();

    const response = await app.inject({ method: 'PATCH', url: `${URL}/${created.id}`, payload: { name: 'Loki' } });

    expect(response.statusCode).toBe(409);
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'PATCH', url: `${URL}/${MISSING_ID}`, payload: { name: 'x' } });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /series/:seriesId', () => {
  it('removes the series with 204 and leaves its funkos without a series', async () => {
    const created = await createSeries();
    const funko = await createFunko({ seriesId: created.id });

    const response = await app.inject({ method: 'DELETE', url: `${URL}/${created.id}` });

    expect(response.statusCode).toBe(204);
    const funkoResponse = await app.inject({ method: 'GET', url: `/funkos/${funko.id}` });
    expect(funkoResponse.statusCode).toBe(200);
    expect(funkoResponse.json()).toMatchObject({ id: funko.id, series: null });
  });

  it('returns 404 when it does not exist', async () => {
    const response = await app.inject({ method: 'DELETE', url: `${URL}/${MISSING_ID}` });

    expect(response.statusCode).toBe(404);
  });
});
