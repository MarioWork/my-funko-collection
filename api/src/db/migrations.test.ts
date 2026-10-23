import { buildApp, type App } from '../app.ts';
import { prepareTestDb } from './testDb.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
  // Migrations only, no reset: this is the database a fresh install starts with.
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

describe('migrations', () => {
  it('create Owned as the default collection and Wishlist on a fresh database', async () => {
    const response = await app.inject({ method: 'GET', url: '/collections' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; isDefault: boolean }[] }>();
    expect(body.data.map(({ name, isDefault }) => ({ name, isDefault }))).toEqual([
      { name: 'Owned', isDefault: true },
      { name: 'Wishlist', isDefault: false },
    ]);
  });
});
