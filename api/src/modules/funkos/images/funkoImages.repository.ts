import { and, asc, eq, max, count } from 'drizzle-orm';
import { db, type DbExecutor } from '../../../db/client.ts';
import { funkoImages, type FunkoImage, type NewFunkoImage } from '../../../db/schema/funkoImages.ts';

const IMAGE_COLUMNS = {
  id: funkoImages.id,
  funkoId: funkoImages.funkoId,
  fileKey: funkoImages.fileKey,
  width: funkoImages.width,
  height: funkoImages.height,
  sizeBytes: funkoImages.sizeBytes,
  contentHash: funkoImages.contentHash,
  placeholder: funkoImages.placeholder,
  position: funkoImages.position,
  createdAt: funkoImages.createdAt,
  updatedAt: funkoImages.updatedAt,
} as const;

// IMAGE_COLUMNS is every column, so a selected row is the table's own row type.
export type FunkoImageRow = FunkoImage;

export type StoredFileUpdate = Pick<
  FunkoImage,
  'fileKey' | 'width' | 'height' | 'sizeBytes' | 'contentHash' | 'placeholder'
>;

export const funkoImagesRepository = {
  listByFunko: (funkoId: number, executor: DbExecutor = db): Promise<FunkoImage[]> =>
    executor
      .select(IMAGE_COLUMNS)
      .from(funkoImages)
      .where(eq(funkoImages.funkoId, funkoId))
      .orderBy(asc(funkoImages.position), asc(funkoImages.id)),

  findById: (funkoId: number, imageId: number, executor: DbExecutor = db): Promise<FunkoImage | undefined> =>
    executor
      .select(IMAGE_COLUMNS)
      .from(funkoImages)
      .where(and(eq(funkoImages.funkoId, funkoId), eq(funkoImages.id, imageId)))
      .get(),

  findIdByHash: (funkoId: number, contentHash: string, executor: DbExecutor = db) =>
    executor
      .select({ id: funkoImages.id })
      .from(funkoImages)
      .where(and(eq(funkoImages.funkoId, funkoId), eq(funkoImages.contentHash, contentHash)))
      .get(),

  countByFunko: async (funkoId: number, executor: DbExecutor = db): Promise<number> => {
    const row = await executor
      .select({ total: count() })
      .from(funkoImages)
      .where(eq(funkoImages.funkoId, funkoId))
      .get();

    return row?.total ?? 0;
  },

  nextPosition: async (funkoId: number, executor: DbExecutor = db): Promise<number> => {
    const row = await executor
      .select({ highest: max(funkoImages.position) })
      .from(funkoImages)
      .where(eq(funkoImages.funkoId, funkoId))
      .get();

    return (row?.highest ?? -1) + 1;
  },

  create: (data: NewFunkoImage, executor: DbExecutor = db): Promise<FunkoImage> =>
    executor.insert(funkoImages).values(data).returning(IMAGE_COLUMNS).get(),

  replaceFile: (imageId: number, data: StoredFileUpdate, executor: DbExecutor = db): Promise<FunkoImage | undefined> =>
    executor.update(funkoImages).set(data).where(eq(funkoImages.id, imageId)).returning(IMAGE_COLUMNS).get(),

  // Positions follow the order of `imageIds`; runs in one transaction so a half-applied order never shows.
  setPositions: (funkoId: number, imageIds: number[]): Promise<void> =>
    db.transaction(async (tx) => {
      for (const [position, imageId] of imageIds.entries()) {
        await tx
          .update(funkoImages)
          .set({ position })
          .where(and(eq(funkoImages.funkoId, funkoId), eq(funkoImages.id, imageId)));
      }
    }),

  delete: (funkoId: number, imageId: number, executor: DbExecutor = db): Promise<{ fileKey: string } | undefined> =>
    executor
      .delete(funkoImages)
      .where(and(eq(funkoImages.funkoId, funkoId), eq(funkoImages.id, imageId)))
      .returning({ fileKey: funkoImages.fileKey })
      .get(),
};
