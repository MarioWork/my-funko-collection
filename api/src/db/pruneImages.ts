// Removes image files that no row references. Run with: yarn images:prune
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../config/env.ts';
import { FUNKOS_UPLOAD_FOLDER } from '../lib/imageStorage.ts';
import { logger } from '../lib/logger.ts';
import { client, db } from './client.ts';
import { funkoImages } from './schema/index.ts';

const VARIANT_SUFFIX = /(\.md|\.sm)?\.webp$/;

const rows = await db.select({ funkoId: funkoImages.funkoId, fileKey: funkoImages.fileKey }).from(funkoImages);
const knownKeys = new Set(rows.map((row) => `${row.funkoId}/${row.fileKey}`));
const root = join(env.UPLOADS_DIR, FUNKOS_UPLOAD_FOLDER);
let removed = 0;

const funkoFolders = await readdir(root, { withFileTypes: true }).catch(() => []);

for (const folder of funkoFolders) {
  if (!folder.isDirectory()) continue;

  const folderPath = join(root, folder.name);
  const files = await readdir(folderPath);

  for (const file of files) {
    const fileKey = file.replace(VARIANT_SUFFIX, '');
    const isKnown = knownKeys.has(`${folder.name}/${fileKey}`);

    if (isKnown) continue;

    await rm(join(folderPath, file), { force: true });
    removed += 1;
  }

  const isEmptyNow = (await readdir(folderPath)).length === 0;

  if (isEmptyNow) await rm(folderPath, { recursive: true, force: true });
}

logger.info({ removed }, 'pruned orphan image files');
client.close();
