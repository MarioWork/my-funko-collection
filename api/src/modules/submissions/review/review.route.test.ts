// The admins' review of submissions (issue #10): the review list, approving and rejecting.
import { buildApp, type App } from '../../../app.ts';
import { storedFileExists } from '../../../lib/imageStorage.ts';
import { prisma } from '../../../lib/prisma.ts';
import { resetTestDb } from '../../../testDb.ts';
import {
  createCategory,
  createFunko,
  createSeries,
  createUser,
  defaultCollectionId,
  deleteUser,
  makeImage,
  type SignedInClient,
  signIn,
  toFormData,
} from '../../../testFixtures.ts';

const BARCODE = '0889698123456';

let app: App;
let admin: SignedInClient;
let member: SignedInClient;
let otherMember: SignedInClient;

type FunkoBody = { id: number; name: string; status: string; isSubmittedByMe: boolean };
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

// Every funko needs a series: one from the catalogue is made unless the payload names one.
async function sendIn(client: SignedInClient, payload: Record<string, unknown>) {
  const seriesId = payload.seriesId ?? (await createSeries()).id;

  return client.inject({ method: 'POST', url: '/funkos', payload: { seriesId, ...payload } });
}

async function namesListed(client: SignedInClient, url: string): Promise<string[]> {
  const response = await client.inject({ method: 'GET', url });

  return response.json<ListBody<{ name: string }>>().data.map(({ name }) => name);
}

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

describe('GET /submissions/review', () => {
  it('lists every member’s waiting submissions, oldest first, with who sent each, when an admin asks', async () => {
    await createFunko({ name: 'First', status: 'WAITING', submittedById: member.userId });
    await createFunko({ name: 'Second', status: 'WAITING', submittedById: otherMember.userId });
    await createFunko({ name: 'Catalogue' });

    const rows = await reviewList('WAITING');

    expect(rows.map(({ name, submittedBy }) => [name, submittedBy?.id])).toEqual([
      ['First', member.userId],
      ['Second', otherMember.userId],
    ]);
  });

  it('names no sender when the member who sent it in was deleted', async () => {
    const leaving = await createUser('Leaving');
    await createFunko({ name: 'Orphan', status: 'WAITING', submittedById: leaving.id });
    await deleteUser(leaving.id);

    const [row] = await reviewList('WAITING');

    expect(row).toMatchObject({ name: 'Orphan', submittedBy: null });
  });

  it('lists the reviewed submissions under DONE and leaves out an admin’s own funkos', async () => {
    const approved = await createFunko({ name: 'Approved', status: 'WAITING', submittedById: member.userId });
    const rejected = await createFunko({ name: 'Rejected', status: 'WAITING', submittedById: member.userId });
    await createFunko({ name: 'Catalogue' });
    await admin.inject({ method: 'POST', url: `/submissions/${approved.id}/approval` });
    await admin.inject({
      method: 'POST',
      url: `/submissions/${rejected.id}/rejection`,
      payload: { reason: 'Blurry photo' },
    });

    const rows = await reviewList('DONE');

    expect(rows.map(({ name, status, rejectionReason }) => [name, status, rejectionReason])).toEqual([
      ['Rejected', 'REJECTED', 'Blurry photo'],
      ['Approved', 'APPROVED', null],
    ]);
  });

  it('flags a maybe-double on the same barcode, and on the same number and category name', async () => {
    const category = await createCategory('Pop! Marvel');
    const sameBarcode = await createFunko({ name: 'Scanned', barcode: BARCODE });
    const sameNumber = await createFunko({ name: 'Numbered', number: '78', categoryId: category.id });
    const memberCategory = await createCategory('pop! marvel', { status: 'WAITING', submittedById: member.userId });
    await createFunko({ name: 'Unrelated', number: '79', categoryId: category.id });
    await createFunko({
      name: 'Thanos',
      number: '78',
      barcode: BARCODE,
      categoryId: memberCategory.id,
      status: 'WAITING',
      submittedById: member.userId,
    });

    const [row] = await reviewList('WAITING');

    expect(row?.possibleDoubles).toEqual([
      expect.objectContaining({ id: sameBarcode.id, matchedOn: ['BARCODE'] }),
      expect.objectContaining({ id: sameNumber.id, matchedOn: ['NUMBER_AND_CATEGORY'] }),
    ]);
  });

  it('says whether each maybe-double is a chase and which exclusive it is, so look-alikes can be told apart', async () => {
    const category = await createCategory('Pop! Marvel');
    const regular = await createFunko({ name: 'Thanos', number: '78', categoryId: category.id });
    const chase = await createFunko({ name: 'Thanos', number: '78', categoryId: category.id, isChase: true });
    const exclusive = await createFunko({ name: 'Thanos', number: '78', categoryId: category.id, exclusive: 'SDCC' });
    await createFunko({
      name: 'Thanos',
      number: '78',
      categoryId: category.id,
      status: 'WAITING',
      submittedById: member.userId,
    });

    const [row] = await reviewList('WAITING');

    expect(row?.possibleDoubles.map(({ id, isChase, exclusive }) => ({ id, isChase, exclusive }))).toEqual([
      { id: regular.id, isChase: false, exclusive: '' },
      { id: chase.id, isChase: true, exclusive: '' },
      { id: exclusive.id, isChase: false, exclusive: 'SDCC' },
    ]);
  });

  it('flags another member’s waiting submission of the same box as a maybe-double', async () => {
    const category = await createCategory();
    const theirs = await createFunko({ barcode: BARCODE, status: 'WAITING', submittedById: otherMember.userId });
    await createFunko({ barcode: BARCODE, categoryId: category.id, status: 'WAITING', submittedById: member.userId });

    const rows = await reviewList('WAITING');

    expect(rows[1]?.possibleDoubles.map(({ id }) => id)).toEqual([theirs.id]);
  });

  it('returns 403 ADMIN_ONLY when a member asks for it', async () => {
    const response = await member.inject({ method: 'GET', url: '/submissions/review' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('returns 400 when the state is not WAITING or DONE', async () => {
    const response = await admin.inject({ method: 'GET', url: '/submissions/review?state=LATER' });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /submissions/:funkoId/approval', () => {
  it('puts the funko, its new category and its new series in everyone’s catalogue when an admin approves it', async () => {
    const category = await member.inject({ method: 'POST', url: '/categories', payload: { name: 'Pop! New' } });
    const series = await member.inject({ method: 'POST', url: '/series', payload: { name: 'New Show' } });
    const sent = await sendIn(member, {
      name: 'Hero',
      number: '1',
      categoryId: category.json<{ id: number }>().id,
      seriesId: series.json<{ id: number }>().id,
    });

    const response = await admin.inject({ method: 'POST', url: `/submissions/${sent.json<FunkoBody>().id}/approval` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'APPROVED', reviewedAt: expect.any(String) as unknown });
    expect(await namesListed(otherMember, '/funkos')).toEqual(['Hero']);
    expect(await namesListed(otherMember, '/categories')).toEqual(['Pop! New']);
    expect(await namesListed(otherMember, '/series')).toEqual(['New Show']);
  });

  it('files it under the catalogue’s category of the same name when an admin added that one meanwhile', async () => {
    const memberCategory = await member.inject({ method: 'POST', url: '/categories', payload: { name: 'Pop! Rock' } });
    const sent = await sendIn(member, { name: 'Singer', number: '5', categoryId: memberCategory.json<FunkoBody>().id });
    const catalogueCategory = await admin.inject({
      method: 'POST',
      url: '/categories',
      payload: { name: 'Pop! Rock' },
    });

    await admin.inject({ method: 'POST', url: `/submissions/${sent.json<FunkoBody>().id}/approval` });

    const detail = await otherMember.inject({ method: 'GET', url: `/funkos/${sent.json<FunkoBody>().id}` });
    expect(detail.json()).toMatchObject({ category: { id: catalogueCategory.json<FunkoBody>().id } });
    expect(await prisma.category.count({ where: { id: memberCategory.json<FunkoBody>().id } })).toBe(0);
  });

  it('returns 409 with the catalogue funko’s id when the catalogue got the same barcode meanwhile', async () => {
    const category = await createCategory();
    const sent = await sendIn(member, { name: 'Thanos', number: '78', categoryId: category.id, barcode: BARCODE });
    const added = await sendIn(admin, { name: 'Other', number: '1', categoryId: category.id, barcode: BARCODE });

    const response = await admin.inject({ method: 'POST', url: `/submissions/${sent.json<FunkoBody>().id}/approval` });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: expect.stringContaining('barcode belongs to another funko in the catalogue') as unknown,
      existingId: added.json<FunkoBody>().id,
    });
    expect(await namesListed(otherMember, '/funkos')).toEqual(['Other']);
  });

  it('returns 409 with the catalogue funko’s id when the catalogue got the same funko meanwhile', async () => {
    const category = await createCategory();
    const payload = { name: 'Thanos', number: '78', categoryId: category.id };
    const sent = await sendIn(member, payload);
    const added = await sendIn(admin, payload);

    const response = await admin.inject({ method: 'POST', url: `/submissions/${sent.json<FunkoBody>().id}/approval` });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: expect.stringContaining('catalogue already has this funko') as unknown,
      existingId: added.json<FunkoBody>().id,
    });
  });

  it('returns 409 when the submission is not waiting', async () => {
    const rejected = await createFunko({ status: 'REJECTED', submittedById: member.userId });

    const response = await admin.inject({ method: 'POST', url: `/submissions/${rejected.id}/approval` });

    expect(response.statusCode).toBe(409);
  });

  it('returns 404 when there is no such funko', async () => {
    const response = await admin.inject({ method: 'POST', url: '/submissions/999999/approval' });

    expect(response.statusCode).toBe(404);
  });

  it('approves an orphan when its sender was deleted', async () => {
    const leaving = await createUser('Leaving');
    const orphan = await createFunko({ name: 'Orphan', status: 'WAITING', submittedById: leaving.id });
    await deleteUser(leaving.id);

    const response = await admin.inject({ method: 'POST', url: `/submissions/${orphan.id}/approval` });

    expect(response.statusCode).toBe(200);
    expect(await namesListed(member, '/funkos')).toEqual(['Orphan']);
  });
});

describe('POST /submissions/:funkoId/rejection', () => {
  it('keeps the funko private in the sender’s collection, with the reason they read, when an admin rejects it', async () => {
    const category = await createCategory();
    const sent = await sendIn(member, { name: 'Fake', number: '1', categoryId: category.id });
    const funkoId = sent.json<FunkoBody>().id;
    await member.inject({
      method: 'POST',
      url: `/collections/${await defaultCollectionId(member.userId)}/items`,
      payload: { funkoId },
    });

    const response = await admin.inject({
      method: 'POST',
      url: `/submissions/${funkoId}/rejection`,
      payload: { reason: '  Not a real funko  ' },
    });

    expect(response.statusCode).toBe(200);
    const mine = await member.inject({ method: 'GET', url: '/submissions' });
    expect(mine.json<ListBody<ReviewRow>>().data).toEqual([
      expect.objectContaining({ status: 'REJECTED', rejectionReason: 'Not a real funko' }),
    ]);
    const items = await member.inject({ method: 'GET', url: '/items' });
    expect(items.json<ListBody<unknown>>().totalResultNumber).toBe(1);
    expect(await namesListed(otherMember, '/funkos')).toEqual([]);
  });

  it('returns 400 when the reason is empty', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await admin.inject({
      method: 'POST',
      url: `/submissions/${waiting.id}/rejection`,
      payload: { reason: '   ' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 409 when the submission was already approved', async () => {
    const approved = await createFunko({ status: 'APPROVED', submittedById: member.userId });

    const response = await admin.inject({
      method: 'POST',
      url: `/submissions/${approved.id}/rejection`,
      payload: { reason: 'Too late' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('returns 403 ADMIN_ONLY when a member tries it', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: otherMember.userId });

    const response = await member.inject({
      method: 'POST',
      url: `/submissions/${waiting.id}/rejection`,
      payload: { reason: 'Mine is better' },
    });

    expect(response.statusCode).toBe(403);
  });
});

describe('POST /submissions/:funkoId/rejection of an orphan submission', () => {
  it('deletes it, with its sender’s unused waiting category, and keeps its image files for images:prune', async () => {
    const leaving = await createUser('Leaving');
    const leavingClient = await signIn(app, { userId: leaving.id });
    const category = await leavingClient.inject({ method: 'POST', url: '/categories', payload: { name: 'Pop! Gone' } });
    const sent = await sendIn(leavingClient, {
      name: 'Orphan',
      number: '1',
      categoryId: category.json<FunkoBody>().id,
    });
    const orphanId = sent.json<FunkoBody>().id;
    const upload = await leavingClient.inject({
      method: 'POST',
      url: `/funkos/${orphanId}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });
    const [image] = upload.json<{ url: string }[]>();
    await deleteUser(leaving.id);

    const response = await admin.inject({
      method: 'POST',
      url: `/submissions/${orphanId}/rejection`,
      payload: { reason: 'Nobody to fix it' },
    });

    expect(response.statusCode).toBe(204);
    expect(await prisma.funko.count({ where: { id: orphanId } })).toBe(0);
    expect(await prisma.category.count({ where: { id: category.json<FunkoBody>().id } })).toBe(0);
    expect(await reviewList('DONE')).toEqual([]);
    expect(await storedFileExists(image?.url ?? '')).toBe(true);
  });
});
