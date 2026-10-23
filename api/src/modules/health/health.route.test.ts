import { buildApp, type App } from '../../app.ts';
import { prepareTestDb } from '../../db/testDb.ts';
import { healthRepository } from './health.repository.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('answers ok when the process is up', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('answers ok when the database answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('returns 503 with NOT_READY when the database does not answer', async () => {
    vi.spyOn(healthRepository, 'ping').mockRejectedValueOnce(new Error('connection lost'));

    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ code: 'NOT_READY', message: 'Database is not reachable' });
  });
});

describe('GET /<unknown route>', () => {
  it('returns 404 with the error envelope when no route matches', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'NOT_FOUND' });
  });
});
