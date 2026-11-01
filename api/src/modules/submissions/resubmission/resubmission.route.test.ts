// A sender sends a rejected submission in again.
import { buildApp, type App } from '../../../app.ts';
import { resetTestDb } from '../../../testDb.ts';
import { createFunko, createUser, type SignedInClient, signIn } from '../../../testFixtures.ts';

const BARCODE = '0889698123456';

let app: App;
let admin: SignedInClient;
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
  admin = await signIn(app);
  member = await signIn(app, { role: 'MEMBER' });
  otherMember = await signIn(app, { userId: (await createUser('Other member')).id });
});

type ReviewRow = {
  id: number;
  name: string;
  status: string;
  submittedBy: { id: number; name: string } | null;
  possibleDoubles: { id: number; matchedOn: string[]; isChase: boolean; exclusive: string }[];
  rejectionReason: string | null;
};

async function reviewList(state: 'WAITING' | 'DONE'): Promise<ReviewRow[]> {
  const response = await admin.inject({ method: 'GET', url: `/submissions/review?state=${state}` });

  return response.json<ListBody<ReviewRow>>().data;
}

async function namesListed(client: SignedInClient, url: string): Promise<string[]> {
  const response = await client.inject({ method: 'GET', url });

  return response.json<ListBody<{ name: string }>>().data.map(({ name }) => name);
}

describe('POST /submissions/:funkoId/resubmission', () => {
  it('clears the admin-changed note when the sender sends it again', async () => {
    const rejected = await createFunko({ status: 'REJECTED', submittedById: member.userId });
    await admin.inject({ method: 'PATCH', url: `/funkos/${rejected.id}`, payload: { name: 'Admin fixed' } });

    const response = await member.inject({ method: 'POST', url: `/submissions/${rejected.id}/resubmission` });

    expect(response.json()).toMatchObject({ status: 'WAITING', changedByAdminAt: null });
  });

  it('makes a fixed rejected submission wait again, without the reason, when its sender sends it again', async () => {
    const rejected = await createFunko({ name: 'Fixed', status: 'REJECTED', submittedById: member.userId });

    const response = await member.inject({ method: 'POST', url: `/submissions/${rejected.id}/resubmission` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'WAITING', rejectionReason: null });
    expect((await reviewList('WAITING')).map(({ name }) => name)).toEqual(['Fixed']);
    expect(await namesListed(member, '/funkos')).toEqual(['Fixed']);
  });

  it('returns 409 when the sender already waits on another funko with the same barcode', async () => {
    await createFunko({ barcode: BARCODE, status: 'WAITING', submittedById: member.userId });
    const rejected = await createFunko({ barcode: BARCODE, status: 'REJECTED', submittedById: member.userId });

    const response = await member.inject({ method: 'POST', url: `/submissions/${rejected.id}/resubmission` });

    expect(response.statusCode).toBe(409);
  });

  it('returns 409 when the submission is not rejected', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await member.inject({ method: 'POST', url: `/submissions/${waiting.id}/resubmission` });

    expect(response.statusCode).toBe(409);
  });

  it('returns 404 when another member tries to send someone’s rejected submission again', async () => {
    const rejected = await createFunko({ status: 'REJECTED', submittedById: otherMember.userId });

    const response = await member.inject({ method: 'POST', url: `/submissions/${rejected.id}/resubmission` });

    expect(response.statusCode).toBe(404);
  });
});
