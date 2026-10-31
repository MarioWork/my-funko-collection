import type { FunkoImage, Prisma } from '../../../generated/prisma/client.ts';
import { ID_SELECT, prisma } from '../../../lib/prisma.ts';

const IMAGE_SELECT = {
  id: true,
  funkoId: true,
  uploadedById: true,
  fileKey: true,
  width: true,
  height: true,
  sizeBytes: true,
  contentHash: true,
  placeholder: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FunkoImageSelect;

const FILE_KEY_SELECT = { fileKey: true } as const;

// IMAGE_SELECT is every column, so a selected row is the model's own type.
export type FunkoImageRow = FunkoImage;

export type NewFunkoImage = Omit<Prisma.FunkoImageUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

export type StoredFileUpdate = Pick<
  FunkoImage,
  'fileKey' | 'width' | 'height' | 'sizeBytes' | 'contentHash' | 'placeholder'
>;

const POSITION_ORDER = [
  { position: 'asc' },
  { id: 'asc' },
] as const satisfies Prisma.FunkoImageOrderByWithRelationInput[];

export const funkoImagesRepository = {
  // Where the parent funko stands and who sent it in, for the 404 / 403 checks, read here so this sub-resource
  // never imports the parent's service back. Undefined when there is no such funko.
  findFunkoAccess: async (funkoId: number) =>
    (await prisma.funko.findUnique({ where: { id: funkoId }, select: { status: true, submittedById: true } })) ??
    undefined,

  listByFunko: (funkoId: number): Promise<FunkoImage[]> =>
    prisma.funkoImage.findMany({ where: { funkoId }, select: IMAGE_SELECT, orderBy: [...POSITION_ORDER] }),

  findById: async (funkoId: number, imageId: number): Promise<FunkoImage | undefined> =>
    (await prisma.funkoImage.findFirst({ where: { funkoId, id: imageId }, select: IMAGE_SELECT })) ?? undefined,

  findIdByHash: async (funkoId: number, contentHash: string) =>
    (await prisma.funkoImage.findFirst({ where: { funkoId, contentHash }, select: ID_SELECT })) ?? undefined,

  countByFunko: (funkoId: number): Promise<number> => prisma.funkoImage.count({ where: { funkoId } }),

  nextPosition: async (funkoId: number): Promise<number> => {
    const totals = await prisma.funkoImage.aggregate({ where: { funkoId }, _max: { position: true } });

    return (totals._max.position ?? -1) + 1;
  },

  create: (data: NewFunkoImage): Promise<FunkoImage> => prisma.funkoImage.create({ data, select: IMAGE_SELECT }),

  replaceFile: async (imageId: number, data: StoredFileUpdate): Promise<FunkoImage | undefined> => {
    const [updated] = await prisma.funkoImage.updateManyAndReturn({
      where: { id: imageId },
      data,
      select: IMAGE_SELECT,
    });

    return updated;
  },

  // Positions follow the order of `imageIds`; runs in one transaction so a half-applied order never shows.
  setPositions: async (funkoId: number, imageIds: number[]): Promise<void> => {
    await prisma.$transaction(
      imageIds.map((imageId, position) =>
        prisma.funkoImage.updateMany({ where: { funkoId, id: imageId }, data: { position } }),
      ),
    );
  },

  // Read and delete in one transaction, so the file key returned is the one of the row that went.
  delete: (funkoId: number, imageId: number): Promise<{ fileKey: string } | undefined> =>
    prisma.$transaction(async (tx) => {
      const image = await tx.funkoImage.findFirst({ where: { funkoId, id: imageId }, select: FILE_KEY_SELECT });

      if (!image) return undefined;

      await tx.funkoImage.delete({ where: { id: imageId } });

      return image;
    }),
};
