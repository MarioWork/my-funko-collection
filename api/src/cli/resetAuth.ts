// Locked out? Removes the user, every passkey, the password and every sign-in, then prints a new setup link. The
// collection itself (funkos, collections, images) is not touched.
// Dev: yarn auth:reset. In the container: docker compose exec api node dist/cli/resetAuth.js
import { logger } from '../lib/logger.ts';
import { prisma } from '../lib/prisma.ts';
import { addSetupCode, deleteSignIns, getSetupLink } from '../modules/auth/auth.service.ts';

await deleteSignIns();
const code = await addSetupCode();

logger.warn('every passkey, password and sign-in removed: open the new setup link printed in this terminal');
// The link is a secret: plain stdout, never the structured log.
process.stdout.write(`\nOpen this link to make a new passkey (works once):\n${code ? getSetupLink(code) : ''}\n\n`);
await prisma.$disconnect();
