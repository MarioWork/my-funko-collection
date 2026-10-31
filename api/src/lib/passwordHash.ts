import { argon2, randomBytes, timingSafeEqual, type Argon2Parameters } from 'node:crypto';
import { promisify } from 'node:util';

// OWASP Password Storage Cheat Sheet, first argon2id option: 19 MiB of memory, 2 passes, 1 lane. Each hash holds
// its own settings, so raising these later still verifies the old hashes.
const MEMORY_KIB = 19_456;
const PASSES = 2;
const PARALLELISM = 1;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const ALGORITHM = 'argon2id';
const VERSION = 19;

// $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>: the PHC string form, base64 without padding.
const PHC_PATTERN = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

type HashSettings = Pick<Argon2Parameters, 'memory' | 'passes' | 'parallelism'>;

const deriveKey = promisify(argon2);

// Passwords are compared as Unicode NFKC, so the same password typed on two keyboards is the same password.
export function normalisePassword(password: string): string {
  return password.normalize('NFKC');
}

function toBase64(bytes: Buffer): string {
  return bytes.toString('base64').replace(/=+$/, '');
}

async function derive(password: string, salt: Buffer, settings: HashSettings, length: number): Promise<Buffer> {
  return deriveKey(ALGORITHM, {
    message: normalisePassword(password),
    nonce: salt,
    tagLength: length,
    ...settings,
  });
}

// The argon2id hash of a password, with a fresh random salt, as one string to store.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const settings: HashSettings = { memory: MEMORY_KIB, passes: PASSES, parallelism: PARALLELISM };
  const hash = await derive(password, salt, settings, HASH_BYTES);

  return `$${ALGORITHM}$v=${VERSION}$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${toBase64(salt)}$${toBase64(hash)}`;
}

// Whether the password is the one the stored hash was made from. A string that is not such a hash is never a match.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const match = PHC_PATTERN.exec(storedHash);

  if (!match) return false;

  const [, memory, passes, parallelism, salt, hash] = match;
  const settings: HashSettings = { memory: Number(memory), passes: Number(passes), parallelism: Number(parallelism) };
  const expected = Buffer.from(hash ?? '', 'base64');
  const actual = await derive(password, Buffer.from(salt ?? '', 'base64'), settings, expected.length);

  return timingSafeEqual(actual, expected);
}
