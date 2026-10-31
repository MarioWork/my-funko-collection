import { hashPassword, verifyPassword } from './passwordHash.ts';

const PASSWORD = 'correct horse battery staple';

describe('hashPassword', () => {
  it('stores an argon2id hash with its settings, never the password', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
    expect(hash).not.toContain(PASSWORD);
  });

  it('salts each hash, so the same password hashes differently twice', async () => {
    expect(await hashPassword(PASSWORD)).not.toBe(await hashPassword(PASSWORD));
  });
});

describe('verifyPassword', () => {
  it('matches the password the hash was made from', async () => {
    expect(await verifyPassword(PASSWORD, await hashPassword(PASSWORD))).toBe(true);
  });

  it('refuses any other password', async () => {
    expect(await verifyPassword(`${PASSWORD}!`, await hashPassword(PASSWORD))).toBe(false);
  });

  it('matches the same password typed in another Unicode form', async () => {
    const composed = 'café au lait, s’il vous plaît';
    const decomposed = composed.normalize('NFD');

    expect(await verifyPassword(decomposed, await hashPassword(composed))).toBe(true);
  });

  it('never matches a stored value that is not an argon2id hash', async () => {
    expect(await verifyPassword(PASSWORD, PASSWORD)).toBe(false);
  });
});
