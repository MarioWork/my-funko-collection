// Members send funkos in as submissions (docs/adr/0001-shared-catalogue-own-collections.md): what each user sees and
// may change, through the funko, category, series, item, suggest and submissions routes.
import { buildApp, type App } from '../../app.ts';
import { storedFileExists } from '../../lib/imageStorage.ts';
import { prisma } from '../../lib/prisma.ts';
import { resetTestDb } from '../../testDb.ts';
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
} from '../../testFixtures.ts';

const BARCODE = '0889698123456';
const UPC_BARCODE = '889698123456';

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

async function sendIn(client: SignedInClient, payload: Record<string, unknown>) {
  return client.inject({ method: 'POST', url: '/funkos', payload });
}

async function namesListed(client: SignedInClient, url: string): Promise<string[]> {
  const response = await client.inject({ method: 'GET', url });

  return response.json<ListBody<{ name: string }>>().data.map(({ name }) => name);
}

describe('POST /funkos', () => {
  it('adds the funko straight to the catalogue when an admin sends it', async () => {
    const category = await createCategory();

    const response = await sendIn(admin, { name: 'Thanos', number: '78', categoryId: category.id });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Thanos', status: 'APPROVED', isSubmittedByMe: false });
    expect(await namesListed(otherMember, '/funkos')).toEqual(['Thanos']);
  });

  it('makes a waiting submission only the sender sees when a member sends it', async () => {
    const category = await createCategory();

    const response = await sendIn(member, { name: 'Thanos', number: '78', categoryId: category.id });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Thanos', status: 'WAITING', isSubmittedByMe: true });
    expect(await namesListed(member, '/funkos')).toEqual(['Thanos']);
    expect(await namesListed(otherMember, '/funkos')).toEqual([]);
    expect(await namesListed(admin, '/funkos')).toEqual([]);
  });

  it('lets two members each wait on the same barcode and identity when neither is approved', async () => {
    const category = await createCategory();
    const payload = { name: 'Thanos', number: '78', categoryId: category.id, barcode: BARCODE };

    const first = await sendIn(member, payload);
    const second = await sendIn(otherMember, payload);

    expect([first.statusCode, second.statusCode]).toEqual([201, 201]);
  });

  it('returns 409 with the waiting one’s id when the same member sends the same barcode twice', async () => {
    const category = await createCategory();
    const first = await sendIn(member, { name: 'Thanos', number: '78', categoryId: category.id, barcode: BARCODE });

    const second = await sendIn(member, { name: 'Other', number: '1', categoryId: category.id, barcode: UPC_BARCODE });

    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: 'CONFLICT', existingId: first.json<FunkoBody>().id });
  });

  it('returns 409 with the catalogue funko’s id when a member sends in one the catalogue has', async () => {
    const existing = await createFunko({ barcode: BARCODE });
    const category = await createCategory();

    const response = await sendIn(member, { name: 'Copy', number: '1', categoryId: category.id, barcode: BARCODE });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'CONFLICT', existingId: existing.id });
  });

  it('lets an admin add a funko a member is waiting on when the catalogue does not have it yet', async () => {
    const category = await createCategory();
    const payload = { name: 'Thanos', number: '78', categoryId: category.id, barcode: BARCODE };
    await sendIn(member, payload);

    const response = await sendIn(admin, payload);

    expect(response.statusCode).toBe(201);
  });

  it('files it under a category and series the member typed in when they are the member’s own', async () => {
    const category = await member.inject({ method: 'POST', url: '/categories', payload: { name: 'Pop! New' } });
    const series = await member.inject({ method: 'POST', url: '/series', payload: { name: 'New Show' } });

    const response = await sendIn(member, {
      name: 'Hero',
      number: '1',
      categoryId: category.json<{ id: number }>().id,
      seriesId: series.json<{ id: number }>().id,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ category: { name: 'Pop! New' }, series: { name: 'New Show' } });
  });

  it('returns 400 when the category is another member’s waiting one', async () => {
    const othersCategory = await createCategory('Pop! Theirs', {
      status: 'WAITING',
      submittedById: otherMember.userId,
    });

    const response = await sendIn(member, { name: 'Hero', number: '1', categoryId: othersCategory.id });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 400 when an admin files a catalogue funko under a member’s waiting series', async () => {
    const category = await createCategory();
    const waitingSeries = await createSeries('New Show', { status: 'WAITING', submittedById: member.userId });

    const response = await sendIn(admin, {
      name: 'Hero',
      number: '1',
      categoryId: category.id,
      seriesId: waitingSeries.id,
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /categories', () => {
  it('lists a member’s new category only for that member when it waits for approval', async () => {
    await createCategory('Pop! Approved');
    await createCategory('Pop! Waiting', { status: 'WAITING', submittedById: member.userId });

    expect(await namesListed(member, '/categories')).toEqual(['Pop! Approved', 'Pop! Waiting']);
    expect(await namesListed(otherMember, '/categories')).toEqual(['Pop! Approved']);
    expect(await namesListed(admin, '/categories')).toEqual(['Pop! Approved']);
  });
});

describe('GET /categories/:categoryId', () => {
  it('returns 404 when a member asks for another member’s waiting category', async () => {
    const waiting = await createCategory('Pop! Waiting', { status: 'WAITING', submittedById: member.userId });

    const response = await otherMember.inject({ method: 'GET', url: `/categories/${waiting.id}` });

    expect(response.statusCode).toBe(404);
  });

  it('counts only the funkos the caller sees when a category holds another member’s submission', async () => {
    const category = await createCategory('Pop! Marvel');
    await createFunko({ categoryId: category.id });
    await createFunko({ categoryId: category.id, status: 'WAITING', submittedById: member.userId });

    const response = await otherMember.inject({ method: 'GET', url: `/categories/${category.id}` });

    expect(response.json()).toMatchObject({ funkoCount: 1 });
  });
});

describe('GET /series', () => {
  it('lists a member’s new series only for that member when it waits for approval', async () => {
    await createSeries('Waiting Show', { status: 'WAITING', submittedById: member.userId });

    expect(await namesListed(member, '/series')).toEqual(['Waiting Show']);
    expect(await namesListed(otherMember, '/series')).toEqual([]);
  });
});

describe('GET /funkos', () => {
  it('finds a waiting submission for its sender only when the search matches it', async () => {
    await createFunko({ name: 'Secret Thanos', status: 'WAITING', submittedById: member.userId });

    const ownSearch = await member.inject({ method: 'GET', url: '/funkos?q=thanos' });
    const otherSearch = await otherMember.inject({ method: 'GET', url: '/funkos?q=thanos' });

    expect(ownSearch.json<ListBody<FunkoBody>>().data.map(({ name }) => name)).toEqual(['Secret Thanos']);
    expect(otherSearch.json<ListBody<unknown>>().totalResultNumber).toBe(0);
  });

  it('leaves out the sender’s rejected and merged submissions when they are no longer waiting', async () => {
    await createFunko({ name: 'Rejected Thanos', status: 'REJECTED', submittedById: member.userId });
    await createFunko({ name: 'Merged Thanos', status: 'MERGED', submittedById: member.userId });

    const response = await member.inject({ method: 'GET', url: '/funkos?q=thanos' });

    expect(response.json<ListBody<unknown>>().totalResultNumber).toBe(0);
  });
});

describe('GET /suggest', () => {
  it('suggests a waiting submission to its sender only when the query matches it', async () => {
    await createFunko({ name: 'Secret Thanos', status: 'WAITING', submittedById: member.userId });

    const own = await member.inject({ method: 'GET', url: '/suggest?q=thanos' });
    const other = await otherMember.inject({ method: 'GET', url: '/suggest?q=thanos' });

    expect(own.json<{ funkos: { name: string }[] }>().funkos.map(({ name }) => name)).toEqual(['Secret Thanos']);
    expect(other.json<{ funkos: unknown[] }>().funkos).toEqual([]);
  });
});

describe('GET /funkos/by-barcode/:barcode', () => {
  it('finds the sender’s own waiting submission when they scan its box', async () => {
    await createFunko({ name: 'Secret Thanos', barcode: BARCODE, status: 'WAITING', submittedById: member.userId });

    const response = await member.inject({ method: 'GET', url: `/funkos/by-barcode/${UPC_BARCODE}` });

    expect(response.json()).toMatchObject({ name: 'Secret Thanos', status: 'WAITING', isSubmittedByMe: true });
  });

  it('returns 404 when another member scans a box only someone’s waiting submission has', async () => {
    await createFunko({ barcode: BARCODE, status: 'WAITING', submittedById: member.userId });

    const response = await otherMember.inject({ method: 'GET', url: `/funkos/by-barcode/${BARCODE}` });

    expect(response.statusCode).toBe(404);
  });

  it('answers the catalogue funko when a barcode is both approved and waiting with the caller', async () => {
    await createFunko({ name: 'Mine', barcode: BARCODE, status: 'WAITING', submittedById: member.userId });
    await createFunko({ name: 'Catalogue', barcode: BARCODE });

    const response = await member.inject({ method: 'GET', url: `/funkos/by-barcode/${BARCODE}` });

    expect(response.json()).toMatchObject({ name: 'Catalogue', status: 'APPROVED' });
  });
});

describe('GET /funkos/:funkoId', () => {
  it('returns 404 when a member opens another member’s waiting submission', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await otherMember.inject({ method: 'GET', url: `/funkos/${waiting.id}` });

    expect(response.statusCode).toBe(404);
  });

  it('lets an admin open a member’s waiting submission, with who sent it, when they know its id', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await admin.inject({ method: 'GET', url: `/funkos/${waiting.id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'WAITING',
      isSubmittedByMe: false,
      submittedBy: { id: member.userId, name: 'Member' },
    });
  });
});

describe('POST /collections/:id/items', () => {
  it('puts the sender’s waiting submission in their own collection when they add it', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const collectionId = await defaultCollectionId(member.userId);

    const response = await member.inject({
      method: 'POST',
      url: `/collections/${collectionId}/items`,
      payload: { funkoId: waiting.id },
    });

    expect(response.statusCode).toBe(201);
  });

  it('returns 404 when another member adds someone’s waiting submission to their collection', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const collectionId = await defaultCollectionId(otherMember.userId);

    const response = await otherMember.inject({
      method: 'POST',
      url: `/collections/${collectionId}/items`,
      payload: { funkoId: waiting.id },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /funkos/:funkoId', () => {
  it('saves the sender’s change when the submission is still waiting', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await member.inject({ method: 'PATCH', url: `/funkos/${waiting.id}`, payload: { name: 'Fixed' } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Fixed', status: 'WAITING' });
  });

  it('returns 404 when another member tries to change someone’s waiting submission', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await otherMember.inject({
      method: 'PATCH',
      url: `/funkos/${waiting.id}`,
      payload: { name: 'Mine now' },
    });

    expect(response.statusCode).toBe(404);
  });

  it('returns 403 ADMIN_ONLY when the sender changes a submission that was approved', async () => {
    const approved = await createFunko({ status: 'APPROVED', submittedById: member.userId });

    const response = await member.inject({
      method: 'PATCH',
      url: `/funkos/${approved.id}`,
      payload: { name: 'Again' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'ADMIN_ONLY' });
  });

  it('saves the sender’s fix when the submission was rejected', async () => {
    const rejected = await createFunko({ status: 'REJECTED', submittedById: member.userId });

    const response = await member.inject({
      method: 'PATCH',
      url: `/funkos/${rejected.id}`,
      payload: { name: 'Fixed' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Fixed', status: 'REJECTED' });
  });

  it('notes the change for the sender when an admin changes their waiting submission', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    await admin.inject({ method: 'PATCH', url: `/funkos/${waiting.id}`, payload: { name: 'Typo fixed' } });

    const detail = await member.inject({ method: 'GET', url: `/funkos/${waiting.id}` });
    expect(detail.json()).toMatchObject({ name: 'Typo fixed', changedByAdminAt: expect.any(String) as unknown });
  });

  it('notes nothing when the sender changes their own waiting submission', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    await member.inject({ method: 'PATCH', url: `/funkos/${waiting.id}`, payload: { name: 'Mine' } });

    const detail = await member.inject({ method: 'GET', url: `/funkos/${waiting.id}` });
    expect(detail.json()).toMatchObject({ changedByAdminAt: null });
  });
});

describe('POST /funkos/:funkoId/images', () => {
  it('stores the sender’s photo when the submission is still waiting', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await member.inject({
      method: 'POST',
      url: `/funkos/${waiting.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    expect(response.statusCode).toBe(201);
  });

  it('notes the change for the sender when an admin adds a photo to their waiting submission', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    await admin.inject({
      method: 'POST',
      url: `/funkos/${waiting.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });

    const detail = await member.inject({ method: 'GET', url: `/funkos/${waiting.id}` });
    expect(detail.json()).toMatchObject({ changedByAdminAt: expect.any(String) as unknown });
  });

  it('notes the change for the sender when an admin removes a photo, but not when they reorder or rotate them', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });
    const upload = await member.inject({
      method: 'POST',
      url: `/funkos/${waiting.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }, { buffer: await makeImage({ noise: true }) }]),
    });
    const [first, second] = upload.json<{ id: number }[]>();
    const changedAt = async () =>
      (await member.inject({ method: 'GET', url: `/funkos/${waiting.id}` })).json<{ changedByAdminAt: unknown }>()
        .changedByAdminAt;

    await admin.inject({
      method: 'PATCH',
      url: `/funkos/${waiting.id}/images/order`,
      payload: { imageIds: [second?.id, first?.id] },
    });
    await admin.inject({
      method: 'POST',
      url: `/funkos/${waiting.id}/images/${first?.id}/rotate`,
      payload: { degrees: 90 },
    });
    const afterReorderAndRotate = await changedAt();
    await admin.inject({ method: 'DELETE', url: `/funkos/${waiting.id}/images/${second?.id}` });

    expect(afterReorderAndRotate).toBeNull();
    expect(typeof (await changedAt())).toBe('string');
  });
});

describe('DELETE /funkos/:funkoId', () => {
  it('withdraws the sender’s waiting submission when they delete it', async () => {
    const waiting = await createFunko({ status: 'WAITING', submittedById: member.userId });

    const response = await member.inject({ method: 'DELETE', url: `/funkos/${waiting.id}` });

    expect(response.statusCode).toBe(204);
  });

  it('deletes the sender’s rejected submission when they give up on it', async () => {
    const rejected = await createFunko({ status: 'REJECTED', submittedById: member.userId });

    const response = await member.inject({ method: 'DELETE', url: `/funkos/${rejected.id}` });

    expect(response.statusCode).toBe(204);
  });
});

type ReviewRow = {
  id: number;
  name: string;
  status: string;
  submittedBy: { id: number; name: string } | null;
  possibleDoubles: { id: number; matchedOn: string[] }[];
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

// An admin deletes a member through the Users routes (issue #7); a database trigger decides what happens to what they
// sent in, whatever code deletes the row.
describe('DELETE /users/:userId', () => {
  async function removeUser(userId: number) {
    const response = await admin.inject({ method: 'DELETE', url: `/users/${userId}` });

    expect(response.statusCode).toBe(204);
  }

  it('keeps their waiting, approved and merged submissions with no sender, and deletes the rejected ones, when an admin deletes the sender', async () => {
    const sender = await createUser('Leaving member');
    const waiting = await createFunko({ status: 'WAITING', submittedById: sender.id });
    const approved = await createFunko({ status: 'APPROVED', submittedById: sender.id });
    const merged = await createFunko({ status: 'MERGED', submittedById: sender.id });
    const rejected = await createFunko({ status: 'REJECTED', submittedById: sender.id });
    const senderClient = await signIn(app, { userId: sender.id });
    const collectionId = await defaultCollectionId(sender.id);
    await senderClient.inject({
      method: 'POST',
      url: `/collections/${collectionId}/items`,
      payload: { funkoId: waiting.id },
    });

    await removeUser(sender.id);

    const statuses = await Promise.all(
      [waiting, approved, merged, rejected].map(
        async ({ id }) => (await admin.inject({ method: 'GET', url: `/funkos/${id}` })).statusCode,
      ),
    );
    expect(statuses).toEqual([200, 200, 200, 404]);
    const waitingAfter = await admin.inject({ method: 'GET', url: `/funkos/${waiting.id}` });
    expect(waitingAfter.json()).toMatchObject({ status: 'WAITING', submittedBy: null });
  });

  it('keeps a waiting category a kept submission uses and deletes the ones nothing uses when the sender goes', async () => {
    const sender = await createUser('Leaving member');
    const usedCategory = await createCategory('Pop! Used', { status: 'WAITING', submittedById: sender.id });
    const unusedCategory = await createCategory('Pop! Unused', { status: 'WAITING', submittedById: sender.id });
    const usedSeries = await createSeries('Used Show', { status: 'WAITING', submittedById: sender.id });
    const unusedSeries = await createSeries('Unused Show', { status: 'WAITING', submittedById: sender.id });
    const rejectedOnlyCategory = await createCategory('Pop! Rejected', { status: 'WAITING', submittedById: sender.id });
    await createFunko({
      categoryId: usedCategory.id,
      seriesId: usedSeries.id,
      status: 'WAITING',
      submittedById: sender.id,
    });
    await createFunko({ categoryId: rejectedOnlyCategory.id, status: 'REJECTED', submittedById: sender.id });

    await removeUser(sender.id);

    const categoryStatuses = await Promise.all(
      [usedCategory, unusedCategory, rejectedOnlyCategory].map(
        async ({ id }) => (await admin.inject({ method: 'GET', url: `/categories/${id}` })).statusCode,
      ),
    );
    const seriesStatuses = await Promise.all(
      [usedSeries, unusedSeries].map(
        async ({ id }) => (await admin.inject({ method: 'GET', url: `/series/${id}` })).statusCode,
      ),
    );
    expect(categoryStatuses).toEqual([200, 404, 404]);
    expect(seriesStatuses).toEqual([200, 404]);
  });

  it('keeps the image files of a deleted rejected submission on disk for images:prune when its sender goes', async () => {
    const sender = await createUser('Leaving member');
    const senderClient = await signIn(app, { userId: sender.id });
    const submission = await createFunko({ status: 'WAITING', submittedById: sender.id });
    const upload = await senderClient.inject({
      method: 'POST',
      url: `/funkos/${submission.id}/images`,
      payload: toFormData([{ buffer: await makeImage() }]),
    });
    const [image] = upload.json<{ url: string }[]>();
    await prisma.funko.update({
      where: { id: submission.id },
      data: { status: 'REJECTED', rejectionReason: 'Blurry' },
    });

    await removeUser(sender.id);

    expect(await storedFileExists(image?.url ?? '')).toBe(true);
  });

  it('lets orphaned waiting submissions of the same box stand side by side and blocks no new one when their senders go', async () => {
    const first = await createUser('First leaving member');
    const second = await createUser('Second leaving member');
    const category = await createCategory();
    const payload = { name: 'Thanos', number: '78', categoryId: category.id, barcode: BARCODE };
    await sendIn(await signIn(app, { userId: first.id }), payload);
    await sendIn(await signIn(app, { userId: second.id }), payload);

    await removeUser(first.id);
    await removeUser(second.id);

    const orphans = await prisma.funko.count({ where: { barcode: BARCODE, status: 'WAITING', submittedById: null } });
    const newSubmission = await sendIn(member, payload);
    const otherMemberList = await namesListed(otherMember, '/funkos');
    expect(orphans).toBe(2);
    expect(newSubmission.statusCode).toBe(201);
    expect(otherMemberList).toEqual([]);
  });
});
