import { readFileSync } from 'node:fs';

// Common passwords of 15 or more characters, one per line, lower-case. Shorter ones are refused by length anyway.
// Built once from SecLists (Passwords/Common-Credentials: xato-net 1M, Pwdb 1M, NCSC 100k), kept in the repo so the
// check needs no outside service. From src/ and from dist/ alike, the file is three folders up.
const LIST_URL = new URL('../../../assets/common-passwords.txt', import.meta.url);

const COMMON_PASSWORDS: ReadonlySet<string> = new Set(
  readFileSync(LIST_URL, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);

// Case does not help: "Password12345678" is as guessable as "password12345678".
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.normalize('NFKC').toLowerCase());
}
