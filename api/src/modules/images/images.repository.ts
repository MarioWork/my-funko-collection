import { prisma } from '../../lib/prisma.ts';

const LINKED_IMAGE_SELECT = {
  id: true,
  funkoId: true,
  fileKey: true,
  width: true,
  height: true,
  sizeBytes: true,
  placeholder: true,
  position: true,
  createdAt: true,
  funko: { select: { name: true, number: true } },
  // Null once the user who uploaded it is deleted.
  uploadedBy: { select: { id: true, name: true } },
} as const;

export type LinkedImageRow = Awaited<ReturnType<typeof imagesRepository.listLinked>>[number];

export const imagesRepository = {
  // Every image row with its funko. One user's collection: a few hundred rows, so the service filters, sorts and
  // pages them together with the loose files on disk.
  listLinked: async () => {
    const images = await prisma.funkoImage.findMany({ select: LINKED_IMAGE_SELECT });

    return images.map(({ funko, ...image }) => ({ ...image, funkoName: funko.name, funkoNumber: funko.number }));
  },
};
