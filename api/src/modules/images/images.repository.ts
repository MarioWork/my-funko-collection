import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { funkoImages } from '../../db/schema/funkoImages.ts';
import { funkos } from '../../db/schema/funkos.ts';

const LINKED_IMAGE_COLUMNS = {
  id: funkoImages.id,
  funkoId: funkoImages.funkoId,
  fileKey: funkoImages.fileKey,
  width: funkoImages.width,
  height: funkoImages.height,
  sizeBytes: funkoImages.sizeBytes,
  placeholder: funkoImages.placeholder,
  position: funkoImages.position,
  createdAt: funkoImages.createdAt,
  funkoName: funkos.name,
  funkoNumber: funkos.number,
} as const;

export type LinkedImageRow = Awaited<ReturnType<typeof imagesRepository.listLinked>>[number];

export const imagesRepository = {
  // Every image row with its funko. One user's collection: a few hundred rows, so the service filters, sorts and
  // pages them together with the loose files on disk.
  listLinked: () =>
    db.select(LINKED_IMAGE_COLUMNS).from(funkoImages).innerJoin(funkos, eq(funkos.id, funkoImages.funkoId)),
};
