import { buildApp, type App } from '../app.ts';

let app: App;

beforeAll(async () => {
  app = await buildApp();
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

describe('GET /docs/json responses', () => {
  type Operation = { responses: Record<string, unknown> };
  type Document = { paths: Record<string, Record<string, Operation>> };

  async function operation(path: string, method: string): Promise<Operation | undefined> {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    return response.json<Document>().paths[path]?.[method];
  }

  it('documents 401 on a locked read and 401 + 403 on a locked write when the auth plugin adds them', async () => {
    expect(Object.keys((await operation('/tags', 'get'))?.responses ?? {})).toContain('401');
    expect(Object.keys((await operation('/tags', 'post'))?.responses ?? {})).toEqual(
      expect.arrayContaining(['401', '403']),
    );
  });

  it('documents no 401 on a public route but 403 on a public write when it is a passkey ceremony', async () => {
    expect(Object.keys((await operation('/health', 'get'))?.responses ?? {})).not.toContain('401');
    const login = Object.keys((await operation('/auth/login/options', 'post'))?.responses ?? {});
    expect(login).not.toContain('401');
    expect(login).toContain('403');
  });
});
