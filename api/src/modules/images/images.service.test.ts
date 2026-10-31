import { buildApp, type App } from '../../app.ts';
import { resetTestDb } from '../../testDb.ts';
import { copyFunkoFile, funkoFolderExists, listFunkoFolder } from '../../lib/imageStorage.ts';
import {
  createFunko,
  forgetImageRows,
  makeImage,
  type SignedInClient,
  signIn,
  toFormData,
} from '../../testFixtures.ts';
import { deleteOrphanImageFiles } from './images.service.ts';

const LOOSE_FILE_NAME = 'leftover.webp';
const STRAY_FILE_NAME = 'upload.tmp';
const SIZES_PER_IMAGE = 3;

let app: App;
let api: SignedInClient;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetTestDb();
  api = await signIn(app);
});

async function uploadImage(funkoId: number): Promise<void> {
  await api.inject({
    method: 'POST',
    url: `/funkos/${funkoId}/images`,
    payload: toFormData([{ buffer: await makeImage({ width: 64 }) }]),
  });
}

async function firstLargeFile(funkoId: number): Promise<string> {
  const files = await listFunkoFolder(funkoId);

  return files.find((file) => !file.includes('.md.') && !file.includes('.sm.')) ?? '';
}

describe('deleteOrphanImageFiles', () => {
  it("removes only the stray files and keeps every size when a used image's folder holds copies no row points at", async () => {
    const groot = await createFunko({ name: 'Groot' });
    await uploadImage(groot.id);
    const largeFile = await firstLargeFile(groot.id);
    await copyFunkoFile(groot.id, largeFile, LOOSE_FILE_NAME);
    await copyFunkoFile(groot.id, largeFile, STRAY_FILE_NAME);

    const removed = await deleteOrphanImageFiles();

    expect(removed).toBe(2);
    expect(await listFunkoFolder(groot.id)).toHaveLength(SIZES_PER_IMAGE);
  });

  it("removes a funko's whole folder when all its image rows are gone", async () => {
    const groot = await createFunko({ name: 'Groot' });
    const eleven = await createFunko({ name: 'Eleven' });
    await uploadImage(groot.id);
    await uploadImage(eleven.id);
    await forgetImageRows(eleven.id);

    const removed = await deleteOrphanImageFiles();

    expect(removed).toBe(SIZES_PER_IMAGE);
    expect(await funkoFolderExists(eleven.id)).toBe(false);
    expect(await funkoFolderExists(groot.id)).toBe(true);
  });

  it('removes nothing when every file belongs to a row', async () => {
    const groot = await createFunko({ name: 'Groot' });
    await uploadImage(groot.id);

    expect(await deleteOrphanImageFiles()).toBe(0);
  });
});
