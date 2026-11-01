import { hashSecureToken } from '../../../lib/secureToken.ts';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, SESSION_TOUCH_INTERVAL_MS, isSetUp } from '../auth.service.ts';
import type { AuthSession } from '../auth.type.ts';
import { sessionRepository, type SessionRow } from './session.repository.ts';
import type { AuthStatusResponse } from './session.schema.ts';

function toAuthSession(row: SessionRow): AuthSession {
  return {
    tokenHash: row.tokenHash,
    userId: row.userId,
    userName: row.userName,
    username: row.username,
    userRole: row.userRole,
    isReadOnly: row.isReadOnly,
    mustChangePassword: row.mustChangePassword,
    signedInAt: row.signedInAt,
  };
}

function isSessionExpired(row: SessionRow, now: number): boolean {
  const isPastAbsolute = now - row.signedInAt.getTime() > SESSION_ABSOLUTE_MS;
  const isPastIdle = now - row.lastSeenAt.getTime() > SESSION_IDLE_MS;

  return isPastAbsolute || isPastIdle;
}

export async function getAuthStatus(session: AuthSession | null): Promise<AuthStatusResponse> {
  if (session) {
    const user = {
      name: session.userName,
      username: session.username,
      role: session.userRole,
      isReadOnly: session.isReadOnly,
      mustChangePassword: session.mustChangePassword,
    };

    return { state: 'signedIn', user };
  }

  return { state: (await isSetUp()) ? 'signedOut' : 'setup' };
}

// The session a cookie token stands for, or null. Expired ones are deleted on sight; a used one is kept alive.
export async function getSession(token: string): Promise<AuthSession | null> {
  const tokenHash = hashSecureToken(token);
  const row = await sessionRepository.findSession(tokenHash);

  if (!row) return null;

  const now = Date.now();

  if (isSessionExpired(row, now)) {
    await sessionRepository.deleteSession(tokenHash);

    return null;
  }

  const isTouchDue = now - row.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS;

  if (isTouchDue) await sessionRepository.touchSession(tokenHash, new Date(now));

  return toAuthSession(row);
}

export async function deleteSession(session: AuthSession): Promise<void> {
  await sessionRepository.deleteSession(session.tokenHash);
}

export async function deleteAllSessions(session: AuthSession): Promise<void> {
  await sessionRepository.deleteUserSessions(session.userId);
}
