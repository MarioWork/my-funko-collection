// Removes image files that no row references. Run with: yarn images:prune
import { client, db } from '../db/client.ts';
import { funkoImages } from '../db/schema/index.ts';
import { pruneOrphanFiles, storedFileKey } from '../lib/imageStorage.ts';
import { logger } from '../lib/logger.ts';

const rows = await db.select({ funkoId: funkoImages.funkoId, fileKey: funkoImages.fileKey }).from(funkoImages);
const knownKeys = new Set(rows.map((row) => storedFileKey(row.funkoId, row.fileKey)));

const removed = await pruneOrphanFiles(knownKeys);

logger.info({ removed }, 'pruned orphan image files');
client.close();
