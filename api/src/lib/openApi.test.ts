import { buildApp, type App } from '../app.ts';
import { prepareTestDb } from '../db/testDb.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
  await prepareTestDb();
});

afterAll(async () => {
  await app.close();
});

describe('GET /docs/json', () => {
  it('lists each named schema once as a component and references it from the routes when the app starts', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const document = response.json<{
      components: { schemas: Record<string, unknown> };
      paths: Record<string, unknown>;
    }>();
    const names = Object.keys(document.components.schemas);
    expect(names).toEqual(
      expect.arrayContaining(['Funko', 'FunkoDetail', 'Collection', 'CollectionItem', 'ErrorResponse']),
    );
    expect(names.filter((name) => name.endsWith('Input'))).toEqual([]);
    expect(JSON.stringify(document.paths['/funkos'])).toContain('#/components/schemas/Funko"');
  });
});
