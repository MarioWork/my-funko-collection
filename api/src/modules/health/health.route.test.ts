import { buildApp, type App } from '../../app.ts';
import { prepareTestDb } from '../../db/testDb.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

describe('health', () => {
  it('answers the liveness and readiness probes', async () => {
    const health = await app.inject({ method: 'GET', url: '/health' });
    const ready = await app.inject({ method: 'GET', url: '/ready' });

    expect(health.json()).toEqual({ status: 'ok' });
    expect(ready.json()).toEqual({ status: 'ok' });
  });

  it('returns the error envelope for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
