import { buildApp, type App } from '../app.ts';
import { signIn } from '../testFixtures.ts';
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

describe('GET /collections', () => {
  it('lists Owned as the default collection and Wishlist when the database was just migrated', async () => {
    const api = await signIn(app);

    const response = await api.inject({ method: 'GET', url: '/collections' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: { name: string; isDefault: boolean }[] }>();
    expect(body.data.map(({ name, isDefault }) => ({ name, isDefault }))).toEqual([
      { name: 'Owned', isDefault: true },
      { name: 'Wishlist', isDefault: false },
    ]);
  });
});
