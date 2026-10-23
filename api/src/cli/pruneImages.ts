// Removes image files that no row references. Run with: yarn images:prune
import { client } from '../db/client.ts';
import { logger } from '../lib/logger.ts';
import { deleteOrphanImageFiles } from '../modules/images/images.service.ts';

const removed = await deleteOrphanImageFiles();

logger.info({ removed }, 'pruned orphan image files');
client.close();
