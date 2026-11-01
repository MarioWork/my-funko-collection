// A member's own submissions list, whatever became of each.
import { buildApp, type App } from '../../../app.ts';
import { resetTestDb } from '../../../testDb.ts';
import { createFunko, createUser, type SignedInClient, signIn } from '../../../testFixtures.ts';

let app: App;
let member: SignedInClient;
let otherMember: SignedInClient;

type ListBody<Row> = { data: Row[]; totalResultNumber: number };

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  await signIn(app);
  member = await signIn(app, { role: 'MEMBER' });
  otherMember = await signIn(app, { userId: (await createUser('Other member')).id });
});

async function namesListed(client: SignedInClient, url: string): Promise<string[]> {
  const response = await client.inject({ method: 'GET', url });

  return response.json<ListBody<{ name: string }>>().data.map(({ name }) => name);
}

describe('GET /submissions', () => {
  it('lists what the member sent in, newest first, with each state, when others sent some in too', async () => {
    await createFunko({ name: 'Older', status: 'APPROVED', submittedById: member.userId });
    await createFunko({ name: 'Newer', status: 'WAITING', submittedById: member.userId });
    await createFunko({ name: 'Theirs', status: 'WAITING', submittedById: otherMember.userId });
    await createFunko({ name: 'Catalogue' });

    const response = await member.inject({ method: 'GET', url: '/submissions' });

    expect(response.statusCode).toBe(200);
    const body = response.json<ListBody<{ name: string; status: string }>>();
    expect(body.data.map(({ name, status }) => [name, status])).toEqual([
      ['Newer', 'WAITING'],
      ['Older', 'APPROVED'],
    ]);
    expect(body.totalResultNumber).toBe(2);
  });

  it('narrows the list to one state when status is sent', async () => {
    await createFunko({ name: 'Approved one', status: 'APPROVED', submittedById: member.userId });
    await createFunko({ name: 'Waiting one', status: 'WAITING', submittedById: member.userId });

    expect(await namesListed(member, '/submissions?status=WAITING')).toEqual(['Waiting one']);
  });

  it('returns 400 when the status is not a known one', async () => {
    const response = await member.inject({ method: 'GET', url: '/submissions?status=LOST' });

    expect(response.statusCode).toBe(400);
  });
});
