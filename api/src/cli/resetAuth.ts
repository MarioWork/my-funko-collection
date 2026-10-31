// Locked out? Removes every passkey, password and sign-in, then prints a new setup link. The users stay, and so
// does everything they own (collections, items) and the catalogue: setup gives the first user a new passkey.
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
