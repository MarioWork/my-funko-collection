import { createHash, randomBytes } from 'node:crypto';

// 256 bits: far past guessing, the size OWASP and the Copenhagen Book give for session tokens.
const TOKEN_BYTES = 32;

// A fresh random token for a cookie or a setup code, URL-safe.
export function createSecureToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

// What the database keeps instead of the token. A plain SHA-256 is enough here (no salt, no slow hash): the token
// is random and long, so there is nothing to brute-force.
export function hashSecureToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
