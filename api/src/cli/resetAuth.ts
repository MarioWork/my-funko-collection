// Locked out? Removes the user, every passkey and sign-in, then prints a new setup link. The collection itself
// (funkos, collections, images) is not touched.
// Dev: yarn auth:reset. In the container: docker compose exec api node dist/cli/resetAuth.js
import { client } from '../db/client.ts';
import { logger } from '../lib/logger.ts';
import { addSetupCode, deleteSignIns, getSetupLink } from '../modules/auth/auth.service.ts';

await deleteSignIns();
const code = await addSetupCode();

logger.warn('every passkey and sign-in removed: the new setup link is printed below');
// The link is a secret: plain stdout, never the structured log.
process.stdout.write(`\nOpen this link to make a new passkey (works once):\n${code ? getSetupLink(code) : ''}\n\n`);
client.close();
